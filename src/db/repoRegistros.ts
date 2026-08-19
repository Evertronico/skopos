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

export async function listNutricao(dias = 14): Promise<RegistroNutricao[]> {
  return query<RegistroNutricao>(
    `SELECT * FROM registros_nutricao WHERE data >= date('now', ?) ORDER BY data DESC`,
    [`-${dias} days`],
  )
}

export async function addNutricao(registro: Omit<RegistroNutricao, 'id'>): Promise<void> {
  await run(
    `INSERT INTO registros_nutricao (data, calorias, proteina_g, carboidrato_g, gordura_g)
     VALUES (?, ?, ?, ?, ?)`,
    [registro.data, registro.calorias, registro.proteina_g, registro.carboidrato_g, registro.gordura_g],
  )
}
