import { query, queryOne, run } from './database'
import { nowHHMM, todayISO } from '../lib/date'
import { registrarLog } from './repoLogs'
import type { DiaPlano, DiaSemana, ExecucaoExercicio, ExercicioPlano, PlanoTreino, RegistroTreino } from './types'

export async function listPlanos(): Promise<PlanoTreino[]> {
  return query<PlanoTreino>('SELECT * FROM planos_treino ORDER BY ativo DESC, id DESC')
}

export async function createPlano(nome: string): Promise<number> {
  await run('INSERT INTO planos_treino (nome, ativo, criado_em) VALUES (?, 1, ?)', [nome, todayISO()])
  const row = await queryOne<{ id: number }>('SELECT last_insert_rowid() as id')
  return row!.id
}

export async function updatePlano(id: number, nome: string): Promise<void> {
  await run('UPDATE planos_treino SET nome = ? WHERE id = ?', [nome, id])
}

/**
 * Cascata explícita em código: ON DELETE CASCADE está declarado no schema, mas depende de
 * PRAGMA foreign_keys estar ativo na sessão que fez o DELETE — dados reais mostraram execuções
 * órfãs (registro_treino_id apontando pra registro já apagado), então não confiamos só nisso.
 */
export async function deletePlano(id: number): Promise<void> {
  const dias = await query<{ id: number }>('SELECT id FROM dias_plano WHERE plano_id = ?', [id])
  for (const dia of dias) await deleteDiaDoPlano(dia.id)
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

export async function updateDiaDoPlano(id: number, diaSemana: DiaSemana, nome: string | null): Promise<void> {
  await run('UPDATE dias_plano SET dia_semana = ?, nome = ? WHERE id = ?', [diaSemana, nome, id])
}

export async function deleteDiaDoPlano(id: number): Promise<void> {
  const registros = await query<{ id: number }>('SELECT id FROM registros_treino WHERE dia_plano_id = ?', [id])
  for (const registro of registros) await deleteRegistroTreino(registro.id)
  await run('DELETE FROM exercicios_plano WHERE dia_plano_id = ?', [id])
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
    `INSERT INTO exercicios_plano (dia_plano_id, nome, ordem, series, repeticoes, carga_kg, descanso_seg, grupo_muscular)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exercicio.dia_plano_id,
      exercicio.nome,
      exercicio.ordem,
      exercicio.series,
      exercicio.repeticoes,
      exercicio.carga_kg,
      exercicio.descanso_seg,
      exercicio.grupo_muscular,
    ],
  )
}

export async function updateExercicioDoDia(
  id: number,
  campos: Pick<ExercicioPlano, 'nome' | 'series' | 'repeticoes' | 'carga_kg' | 'descanso_seg' | 'grupo_muscular'>,
): Promise<void> {
  await run(
    `UPDATE exercicios_plano SET nome = ?, series = ?, repeticoes = ?, carga_kg = ?, descanso_seg = ?, grupo_muscular = ? WHERE id = ?`,
    [campos.nome, campos.series, campos.repeticoes, campos.carga_kg, campos.descanso_seg, campos.grupo_muscular, id],
  )
}

export async function deleteExercicioDoDia(id: number): Promise<void> {
  await run('DELETE FROM exercicios_plano WHERE id = ?', [id])
}

export async function listTodosExerciciosPlano(): Promise<ExercicioPlano[]> {
  return query<ExercicioPlano>('SELECT * FROM exercicios_plano ORDER BY ordem ASC, id ASC')
}

/** Última data em que cada grupo muscular foi treinado (exercício marcado concluído), pra avaliar recuperação. */
export async function ultimoTreinoPorGrupoMuscular(): Promise<Record<string, string>> {
  const linhas = await query<{ grupo: string; ultima_data: string }>(
    `SELECT ep.grupo_muscular as grupo, MAX(rt.data) as ultima_data
     FROM execucoes_exercicio ee
     JOIN exercicios_plano ep ON ep.id = ee.exercicio_plano_id
     JOIN registros_treino rt ON rt.id = ee.registro_treino_id
     WHERE ee.concluido = 1 AND ep.grupo_muscular IS NOT NULL AND ep.grupo_muscular != ''
     GROUP BY ep.grupo_muscular`,
  )
  const mapa: Record<string, string> = {}
  for (const l of linhas) mapa[l.grupo] = l.ultima_data
  return mapa
}

/** Recupera (ou cria) o registro de execução de um dia da ficha numa data específica, semeado com os exercícios planejados. */
export async function iniciarRegistroTreino(diaPlanoId: number, data: string): Promise<number> {
  const existente = await queryOne<RegistroTreino>(
    'SELECT * FROM registros_treino WHERE dia_plano_id = ? AND data = ?',
    [diaPlanoId, data],
  )
  if (existente) return existente.id

  await run('INSERT INTO registros_treino (dia_plano_id, data, hora) VALUES (?, ?, ?)', [
    diaPlanoId,
    data,
    nowHHMM(),
  ])
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

export async function buscarRegistroTreino(diaPlanoId: number, data: string): Promise<RegistroTreino | null> {
  return queryOne<RegistroTreino>('SELECT * FROM registros_treino WHERE dia_plano_id = ? AND data = ?', [
    diaPlanoId,
    data,
  ])
}

/** Todos os registros de treino numa data, de qualquer ficha/dia — permite treinar duas fichas no mesmo dia. */
export async function listRegistrosTreinoPorData(data: string): Promise<RegistroTreino[]> {
  return query<RegistroTreino>('SELECT * FROM registros_treino WHERE data = ? ORDER BY hora ASC, id ASC', [data])
}

export async function listTodosDiasPlano(): Promise<DiaPlano[]> {
  return query<DiaPlano>('SELECT * FROM dias_plano ORDER BY dia_semana ASC')
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
  const agora = new Date().toISOString()
  await run(
    `INSERT INTO execucoes_exercicio
       (registro_treino_id, exercicio_plano_id, nome, series_feitas, repeticoes_feitas, carga_kg, descanso_seg, concluido, iniciado_em, concluido_em)
     VALUES (?, NULL, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      registroTreinoId,
      nome,
      campos.series_feitas ?? null,
      campos.repeticoes_feitas ?? null,
      campos.carga_kg ?? null,
      campos.descanso_seg ?? null,
      agora,
      agora,
    ],
  )
}

export async function atualizarExecucao(
  id: number,
  campos: Partial<
    Pick<
      ExecucaoExercicio,
      'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg' | 'concluido' | 'iniciado_em' | 'concluido_em'
    >
  >,
): Promise<void> {
  const entries = Object.entries(campos)
  if (entries.length === 0) return
  const setClause = entries.map(([campo]) => `${campo} = ?`).join(', ')
  const valores = entries.map(([, valor]) => valor as string | number | null)
  await run(`UPDATE execucoes_exercicio SET ${setClause} WHERE id = ?`, [...valores, id])
}

export async function deleteExecucao(id: number): Promise<void> {
  await run('DELETE FROM execucoes_exercicio WHERE id = ?', [id])
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
  await run('DELETE FROM execucoes_exercicio WHERE registro_treino_id = ?', [id])
  await run('DELETE FROM registros_treino WHERE id = ?', [id])
}
