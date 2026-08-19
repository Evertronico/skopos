import { query, queryOne, run } from './database'
import type { ExecucaoExercicio, ExercicioPlano, PlanoTreino, RegistroTreino } from './types'

export async function listPlanos(): Promise<PlanoTreino[]> {
  return query<PlanoTreino>('SELECT * FROM planos_treino ORDER BY ativo DESC, id DESC')
}

export async function createPlano(nome: string): Promise<number> {
  await run('INSERT INTO planos_treino (nome, ativo) VALUES (?, 1)', [nome])
  const row = await queryOne<{ id: number }>('SELECT last_insert_rowid() as id')
  return row!.id
}

export async function deletePlano(id: number): Promise<void> {
  await run('DELETE FROM planos_treino WHERE id = ?', [id])
}

export async function listExerciciosDoPlano(planoId: number): Promise<ExercicioPlano[]> {
  return query<ExercicioPlano>(
    'SELECT * FROM exercicios_plano WHERE plano_id = ? ORDER BY ordem ASC, id ASC',
    [planoId],
  )
}

export async function addExercicioAoPlano(exercicio: Omit<ExercicioPlano, 'id'>): Promise<void> {
  await run(
    `INSERT INTO exercicios_plano (plano_id, nome, ordem, series, repeticoes, carga_kg, descanso_seg)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      exercicio.plano_id,
      exercicio.nome,
      exercicio.ordem,
      exercicio.series,
      exercicio.repeticoes,
      exercicio.carga_kg,
      exercicio.descanso_seg,
    ],
  )
}

export async function deleteExercicioDoPlano(id: number): Promise<void> {
  await run('DELETE FROM exercicios_plano WHERE id = ?', [id])
}

export async function iniciarRegistroTreino(planoId: number, data: string): Promise<number> {
  const existente = await queryOne<RegistroTreino>(
    'SELECT * FROM registros_treino WHERE plano_id = ? AND data = ?',
    [planoId, data],
  )
  if (existente) return existente.id

  await run('INSERT INTO registros_treino (plano_id, data) VALUES (?, ?)', [planoId, data])
  const row = await queryOne<{ id: number }>('SELECT last_insert_rowid() as id')
  const registroId = row!.id

  const exercicios = await listExerciciosDoPlano(planoId)
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
