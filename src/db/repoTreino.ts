import { query, queryOne, run } from './database'
import { registrarLog } from './repoLogs'
import type { DiaPlano, DiaSemana, ExecucaoExercicio, ExercicioPlano, PlanoTreino, RegistroTreino } from './types'

export async function listPlanos(): Promise<PlanoTreino[]> {
  return query<PlanoTreino>('SELECT * FROM planos_treino ORDER BY ativo DESC, id DESC')
}

export async function createPlano(nome: string): Promise<number> {
  await run('INSERT INTO planos_treino (nome, ativo, criado_em) VALUES (?, 1, ?)', [
    nome,
    new Date().toISOString().slice(0, 10),
  ])
  const row = await queryOne<{ id: number }>('SELECT last_insert_rowid() as id')
  return row!.id
}

export async function deletePlano(id: number): Promise<void> {
  await run('DELETE FROM planos_treino WHERE id = ?', [id])
}

export async function listDiasDoPlano(planoId: number): Promise<DiaPlano[]> {
  return query<DiaPlano>('SELECT * FROM dias_plano WHERE plano_id = ? ORDER BY dia_semana ASC', [planoId])
}

export async function addDiaAoPlano(planoId: number, diaSemana: DiaSemana, nome: string | null): Promise<number> {
  await run('INSERT INTO dias_plano (plano_id, dia_semana, nome) VALUES (?, ?, ?)', [
    planoId,
    diaSemana,
    nome,
  ])
  const row = await queryOne<{ id: number }>('SELECT last_insert_rowid() as id')
  return row!.id
}

export async function deleteDiaDoPlano(id: number): Promise<void> {
  await run('DELETE FROM dias_plano WHERE id = ?', [id])
}

export async function listExerciciosDoDia(diaPlanoId: number): Promise<ExercicioPlano[]> {
  return query<ExercicioPlano>(
    'SELECT * FROM exercicios_plano WHERE dia_plano_id = ? ORDER BY ordem ASC, id ASC',
    [diaPlanoId],
  )
}

export async function addExercicioAoDia(exercicio: Omit<ExercicioPlano, 'id'>): Promise<void> {
  await run(
    `INSERT INTO exercicios_plano (dia_plano_id, nome, ordem, series, repeticoes, carga_kg, descanso_seg)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      exercicio.dia_plano_id,
      exercicio.nome,
      exercicio.ordem,
      exercicio.series,
      exercicio.repeticoes,
      exercicio.carga_kg,
      exercicio.descanso_seg,
    ],
  )
}

export async function deleteExercicioDoDia(id: number): Promise<void> {
  await run('DELETE FROM exercicios_plano WHERE id = ?', [id])
}

/** Recupera (ou cria) o registro de execução de um dia da ficha numa data específica, semeado com os exercícios planejados. */
export async function iniciarRegistroTreino(diaPlanoId: number, data: string): Promise<number> {
  const existente = await queryOne<RegistroTreino>(
    'SELECT * FROM registros_treino WHERE dia_plano_id = ? AND data = ?',
    [diaPlanoId, data],
  )
  if (existente) return existente.id

  await run('INSERT INTO registros_treino (dia_plano_id, data) VALUES (?, ?)', [diaPlanoId, data])
  const row = await queryOne<{ id: number }>('SELECT last_insert_rowid() as id')
  const registroId = row!.id
  await registrarLog('inicio_treino', registroId, data)

  const exercicios = await listExerciciosDoDia(diaPlanoId)
  for (const ex of exercicios) {
    await run(
      `INSERT INTO execucoes_exercicio
         (registro_treino_id, exercicio_plano_id, nome, series_feitas, repeticoes_feitas, carga_kg, descanso_seg, concluido)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [registroId, ex.id, ex.nome, ex.series, ex.repeticoes, ex.carga_kg, ex.descanso_seg],
    )
  }

  return registroId
}

export async function listExecucoes(registroTreinoId: number): Promise<ExecucaoExercicio[]> {
  return query<ExecucaoExercicio>(
    'SELECT * FROM execucoes_exercicio WHERE registro_treino_id = ? ORDER BY id ASC',
    [registroTreinoId],
  )
}

/** Adiciona um exercício avulso ao registro do dia — feito mas não previsto na ficha original. */
export async function adicionarExecucaoAvulsa(
  registroTreinoId: number,
  nome: string,
  campos: Partial<Pick<ExecucaoExercicio, 'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg'>>,
): Promise<void> {
  await run(
    `INSERT INTO execucoes_exercicio
       (registro_treino_id, exercicio_plano_id, nome, series_feitas, repeticoes_feitas, carga_kg, descanso_seg, concluido)
     VALUES (?, NULL, ?, ?, ?, ?, ?, 1)`,
    [
      registroTreinoId,
      nome,
      campos.series_feitas ?? null,
      campos.repeticoes_feitas ?? null,
      campos.carga_kg ?? null,
      campos.descanso_seg ?? null,
    ],
  )
}

export async function atualizarExecucao(
  id: number,
  campos: Partial<Pick<ExecucaoExercicio, 'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg' | 'concluido'>>,
): Promise<void> {
  const entries = Object.entries(campos)
  if (entries.length === 0) return
  const setClause = entries.map(([campo]) => `${campo} = ?`).join(', ')
  const valores = entries.map(([, valor]) => valor as string | number | null)
  await run(`UPDATE execucoes_exercicio SET ${setClause} WHERE id = ?`, [...valores, id])
}

export async function listRegistrosTreino(dias = 14): Promise<RegistroTreino[]> {
  return query<RegistroTreino>(
    `SELECT * FROM registros_treino WHERE data >= date('now', ?) ORDER BY data DESC`,
    [`-${dias} days`],
  )
}

export async function listHistoricoDoDia(diaPlanoId: number, limite = 10): Promise<RegistroTreino[]> {
  return query<RegistroTreino>(
    'SELECT * FROM registros_treino WHERE dia_plano_id = ? ORDER BY data DESC LIMIT ?',
    [diaPlanoId, limite],
  )
}

export async function listRegistrosTreinoEntre(inicioISO: string, fimISO: string): Promise<RegistroTreino[]> {
  return query<RegistroTreino>(
    `SELECT * FROM registros_treino WHERE data >= ? AND data <= ? ORDER BY data ASC`,
    [inicioISO, fimISO],
  )
}

export async function deleteRegistroTreino(id: number): Promise<void> {
  await run('DELETE FROM registros_treino WHERE id = ?', [id])
}
