import { queryOne, run } from './database'
import type { MetasMedidas } from './types'

export async function getMetasMedidas(): Promise<MetasMedidas | null> {
  return queryOne<MetasMedidas>('SELECT * FROM metas_medidas WHERE id = 1')
}

export async function salvarMetasMedidas(metas: Omit<MetasMedidas, 'id'>): Promise<void> {
  await run(
    `INSERT INTO metas_medidas (id, peso_kg, percentual_gordura, cintura_cm, quadril_cm, peito_cm, braco_cm, coxa_cm, pescoco_cm)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       peso_kg = excluded.peso_kg,
       percentual_gordura = excluded.percentual_gordura,
       cintura_cm = excluded.cintura_cm,
       quadril_cm = excluded.quadril_cm,
       peito_cm = excluded.peito_cm,
       braco_cm = excluded.braco_cm,
       coxa_cm = excluded.coxa_cm,
       pescoco_cm = excluded.pescoco_cm`,
    [
      metas.peso_kg,
      metas.percentual_gordura,
      metas.cintura_cm,
      metas.quadril_cm,
      metas.peito_cm,
      metas.braco_cm,
      metas.coxa_cm,
      metas.pescoco_cm,
    ],
  )
}
