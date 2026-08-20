import { query, run } from './database'
import type { RegistroHidratacao, RegistroNutricao, RegistroSono } from './types'

export async function listHidratacao(dias = 14): Promise<RegistroHidratacao[]> {
  return query<RegistroHidratacao>(
    `SELECT * FROM registros_hidratacao WHERE data >= date('now', ?) ORDER BY data DESC`,
    [`-${dias} days`],
  )
}

export async function addHidratacao(data: string, mlConsumido: number): Promise<void> {
  await run(`INSERT INTO registros_hidratacao (data, ml_consumido) VALUES (?, ?)`, [data, mlConsumido])
}

export async function updateHidratacao(id: number, data: string, mlConsumido: number): Promise<void> {
  await run(`UPDATE registros_hidratacao SET data = ?, ml_consumido = ? WHERE id = ?`, [
    data,
    mlConsumido,
    id,
  ])
}

export async function deleteHidratacao(id: number): Promise<void> {
  await run('DELETE FROM registros_hidratacao WHERE id = ?', [id])
}

export async function listSono(dias = 14): Promise<RegistroSono[]> {
  return query<RegistroSono>(
    `SELECT * FROM registros_sono WHERE data >= date('now', ?) ORDER BY data DESC`,
    [`-${dias} days`],
  )
}

export async function addSono(data: string, horas: number, qualidade: number | null): Promise<void> {
  await run(`INSERT INTO registros_sono (data, horas, qualidade) VALUES (?, ?, ?)`, [
    data,
    horas,
    qualidade,
  ])
}

export async function updateSono(id: number, data: string, horas: number, qualidade: number | null): Promise<void> {
  await run(`UPDATE registros_sono SET data = ?, horas = ?, qualidade = ? WHERE id = ?`, [
    data,
    horas,
    qualidade,
    id,
  ])
}

export async function deleteSono(id: number): Promise<void> {
  await run('DELETE FROM registros_sono WHERE id = ?', [id])
}

export async function listNutricao(dias = 14): Promise<RegistroNutricao[]> {
  return query<RegistroNutricao>(
    `SELECT * FROM registros_nutricao WHERE data >= date('now', ?) ORDER BY data DESC`,
    [`-${dias} days`],
  )
}

export async function addNutricao(registro: Omit<RegistroNutricao, 'id'>): Promise<void> {
  await run(
    `INSERT INTO registros_nutricao (data, descricao, calorias, proteina_g, carboidrato_g, gordura_g)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      registro.data,
      registro.descricao,
      registro.calorias,
      registro.proteina_g,
      registro.carboidrato_g,
      registro.gordura_g,
    ],
  )
}

export async function updateNutricao(id: number, registro: Omit<RegistroNutricao, 'id'>): Promise<void> {
  await run(
    `UPDATE registros_nutricao
     SET data = ?, descricao = ?, calorias = ?, proteina_g = ?, carboidrato_g = ?, gordura_g = ?
     WHERE id = ?`,
    [
      registro.data,
      registro.descricao,
      registro.calorias,
      registro.proteina_g,
      registro.carboidrato_g,
      registro.gordura_g,
      id,
    ],
  )
}

export async function deleteNutricao(id: number): Promise<void> {
  await run('DELETE FROM registros_nutricao WHERE id = ?', [id])
}

/** Descrições de refeições já usadas antes, para sugerir autocomplete no formulário. */
export async function listDescricoesRefeicoesSugeridas(): Promise<string[]> {
  const linhas = await query<{ descricao: string }>(
    `SELECT DISTINCT descricao FROM registros_nutricao
     WHERE descricao IS NOT NULL AND descricao != ''
     ORDER BY id DESC LIMIT 30`,
  )
  return linhas.map((l) => l.descricao)
}

/** Último registro com essa descrição exata (case-insensitive), para preencher os campos automaticamente. */
export async function buscarUltimaRefeicaoPorDescricao(descricao: string): Promise<RegistroNutricao | null> {
  const linhas = await query<RegistroNutricao>(
    `SELECT * FROM registros_nutricao WHERE lower(descricao) = lower(?) ORDER BY id DESC LIMIT 1`,
    [descricao.trim()],
  )
  return linhas[0] ?? null
}
