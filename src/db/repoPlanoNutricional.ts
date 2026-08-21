import { todayISO } from '../lib/date'
import { queryOne, run } from './database'
import type { PlanoNutricional } from './types'

export async function getPlanoNutricional(): Promise<PlanoNutricional | null> {
  return queryOne<PlanoNutricional>('SELECT * FROM planos_nutricionais WHERE id = 1')
}

export async function salvarPlanoNutricional(
  plano: Omit<PlanoNutricional, 'id' | 'criado_em'>,
): Promise<void> {
  await run(
    `INSERT INTO planos_nutricionais (id, calorias, proteina_g, carboidrato_g, gordura_g, agua_ml, sono_horas, criado_em)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       calorias = excluded.calorias,
       proteina_g = excluded.proteina_g,
       carboidrato_g = excluded.carboidrato_g,
       gordura_g = excluded.gordura_g,
       agua_ml = excluded.agua_ml,
       sono_horas = excluded.sono_horas`,
    [
      plano.calorias,
      plano.proteina_g,
      plano.carboidrato_g,
      plano.gordura_g,
      plano.agua_ml,
      plano.sono_horas,
      todayISO(),
    ],
  )
}

export async function removerPlanoNutricional(): Promise<void> {
  await run('DELETE FROM planos_nutricionais WHERE id = 1')
}
