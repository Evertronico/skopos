import type { Database } from 'sql.js'

function tableExists(db: Database, tabela: string): boolean {
  const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
  stmt.bind([tabela])
  const existe = stmt.step()
  stmt.free()
  return existe
}

function tabelaTemColuna(db: Database, tabela: string, coluna: string): boolean {
  const stmt = db.prepare(`PRAGMA table_info(${tabela})`)
  let encontrada = false
  while (stmt.step()) {
    if (stmt.getAsObject().name === coluna) {
      encontrada = true
      break
    }
  }
  stmt.free()
  return encontrada
}

/**
 * Schema v1 tinha planos_treino → exercicios_plano/registros_treino ligados direto por plano_id,
 * sem conceito de dia da semana. Schema v2 introduziu dias_plano no meio dessa relação.
 * Reconstrói as tabelas no novo formato preservando ids (para não quebrar execucoes_exercicio,
 * que não muda de formato e não é tocada aqui) em vez de simplesmente descartar o banco antigo.
 */
function migrarV1ParaV2(db: Database): void {
  db.run('ALTER TABLE planos_treino RENAME TO _old_planos_treino')
  db.run('ALTER TABLE exercicios_plano RENAME TO _old_exercicios_plano')
  db.run('ALTER TABLE registros_treino RENAME TO _old_registros_treino')

  db.run(`CREATE TABLE planos_treino (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    ativo INTEGER DEFAULT 1,
    criado_em TEXT NOT NULL
  )`)
  db.run(`CREATE TABLE dias_plano (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plano_id INTEGER NOT NULL REFERENCES planos_treino(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL,
    nome TEXT
  )`)
  db.run(`CREATE TABLE exercicios_plano (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dia_plano_id INTEGER NOT NULL REFERENCES dias_plano(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    series INTEGER,
    repeticoes INTEGER,
    carga_kg REAL,
    descanso_seg INTEGER
  )`)
  db.run(`CREATE TABLE registros_treino (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dia_plano_id INTEGER NOT NULL REFERENCES dias_plano(id),
    data TEXT NOT NULL
  )`)

  db.run(
    `INSERT INTO planos_treino (id, nome, ativo, criado_em)
     SELECT id, nome, ativo, date('now') FROM _old_planos_treino`,
  )

  // Um dia sintético por plano antigo — os exercícios existentes viram "o treino daquele dia".
  db.run(
    `INSERT INTO dias_plano (plano_id, dia_semana, nome)
     SELECT id, CAST(strftime('%w', 'now') AS INTEGER), NULL FROM _old_planos_treino`,
  )

  db.run(
    `INSERT INTO exercicios_plano (id, dia_plano_id, nome, ordem, series, repeticoes, carga_kg, descanso_seg)
     SELECT e.id, dp.id, e.nome, e.ordem, e.series, e.repeticoes, e.carga_kg, e.descanso_seg
     FROM _old_exercicios_plano e
     JOIN dias_plano dp ON dp.plano_id = e.plano_id`,
  )

  db.run(
    `INSERT INTO registros_treino (id, dia_plano_id, data)
     SELECT r.id, dp.id, r.data
     FROM _old_registros_treino r
     JOIN dias_plano dp ON dp.plano_id = r.plano_id
     WHERE r.plano_id IS NOT NULL`,
  )

  db.run('DROP TABLE _old_exercicios_plano')
  db.run('DROP TABLE _old_registros_treino')
  db.run('DROP TABLE _old_planos_treino')
}

/** Schema v3 adicionou a descrição da refeição em registros_nutricao (coluna nova, aditiva). */
function migrarV2ParaV3(db: Database): void {
  db.run('ALTER TABLE registros_nutricao ADD COLUMN descricao TEXT')
}

/** Schema v5 adicionou hora (data + hora em vez de só data) e macros no plano nutricional — tudo aditivo. */
function migrarV4ParaV5(db: Database): void {
  const comHora = ['medidas_antropometricas', 'registros_hidratacao', 'registros_sono', 'registros_nutricao', 'registros_treino']
  for (const tabela of comHora) {
    if (tableExists(db, tabela) && !tabelaTemColuna(db, tabela, 'hora')) {
      db.run(`ALTER TABLE ${tabela} ADD COLUMN hora TEXT`)
    }
  }
  if (tableExists(db, 'planos_nutricionais')) {
    if (!tabelaTemColuna(db, 'planos_nutricionais', 'carboidrato_g')) {
      db.run('ALTER TABLE planos_nutricionais ADD COLUMN carboidrato_g REAL')
    }
    if (!tabelaTemColuna(db, 'planos_nutricionais', 'gordura_g')) {
      db.run('ALTER TABLE planos_nutricionais ADD COLUMN gordura_g REAL')
    }
  }
}

/** Schema v6 adicionou grupo muscular no exercício previsto, e início/fim de cada execução — tudo aditivo. */
function migrarV5ParaV6(db: Database): void {
  if (tableExists(db, 'exercicios_plano') && !tabelaTemColuna(db, 'exercicios_plano', 'grupo_muscular')) {
    db.run('ALTER TABLE exercicios_plano ADD COLUMN grupo_muscular TEXT')
  }
  if (tableExists(db, 'execucoes_exercicio')) {
    if (!tabelaTemColuna(db, 'execucoes_exercicio', 'iniciado_em')) {
      db.run('ALTER TABLE execucoes_exercicio ADD COLUMN iniciado_em TEXT')
    }
    if (!tabelaTemColuna(db, 'execucoes_exercicio', 'concluido_em')) {
      db.run('ALTER TABLE execucoes_exercicio ADD COLUMN concluido_em TEXT')
    }
  }
}

/**
 * Remove execuções/exercícios/registros órfãos, deixados por deletes que rodaram antes da cascata
 * ser explícita em código (dependiam só do PRAGMA foreign_keys, que dados reais mostraram falhar
 * em cascatear no sql.js). Idempotente — não altera nada depois da primeira limpeza.
 */
function limparOrfaos(db: Database): boolean {
  if (!tableExists(db, 'registros_treino')) return false
  let linhasRemovidas = 0

  // De cima pra baixo na hierarquia (plano → dia → registro/exercício → execução): um dia órfão
  // só é detectável antes de limpar seus próprios filhos, senão o filho escapa da varredura.
  if (tableExists(db, 'dias_plano') && tableExists(db, 'planos_treino')) {
    db.run('DELETE FROM dias_plano WHERE plano_id NOT IN (SELECT id FROM planos_treino)')
    linhasRemovidas += db.getRowsModified()
  }
  if (tableExists(db, 'dias_plano')) {
    db.run('DELETE FROM registros_treino WHERE dia_plano_id NOT IN (SELECT id FROM dias_plano)')
    linhasRemovidas += db.getRowsModified()
    if (tableExists(db, 'exercicios_plano')) {
      db.run('DELETE FROM exercicios_plano WHERE dia_plano_id NOT IN (SELECT id FROM dias_plano)')
      linhasRemovidas += db.getRowsModified()
    }
  }
  if (tableExists(db, 'execucoes_exercicio')) {
    db.run('DELETE FROM execucoes_exercicio WHERE registro_treino_id NOT IN (SELECT id FROM registros_treino)')
    linhasRemovidas += db.getRowsModified()
  }
  return linhasRemovidas > 0
}

/** Roda as migrações necessárias no banco aberto. Retorna true se algo foi alterado (precisa persistir). */
export function runMigrations(db: Database): boolean {
  let alterou = false

  if (tableExists(db, 'exercicios_plano') && tabelaTemColuna(db, 'exercicios_plano', 'plano_id')) {
    migrarV1ParaV2(db)
    alterou = true
  }

  if (tableExists(db, 'registros_nutricao') && !tabelaTemColuna(db, 'registros_nutricao', 'descricao')) {
    migrarV2ParaV3(db)
    alterou = true
  }

  if (tableExists(db, 'medidas_antropometricas') && !tabelaTemColuna(db, 'medidas_antropometricas', 'hora')) {
    migrarV4ParaV5(db)
    alterou = true
  }

  if (tableExists(db, 'exercicios_plano') && !tabelaTemColuna(db, 'exercicios_plano', 'grupo_muscular')) {
    migrarV5ParaV6(db)
    alterou = true
  }

  if (limparOrfaos(db)) {
    alterou = true
  }

  return alterou
}
