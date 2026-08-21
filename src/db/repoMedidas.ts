import { query, queryOne, run } from './database'
import type { MedidaAntropometrica } from './types'

export async function listMedidas(): Promise<MedidaAntropometrica[]> {
  return query<MedidaAntropometrica>('SELECT * FROM medidas_antropometricas ORDER BY data DESC')
}

export async function getMedidaPorData(data: string): Promise<MedidaAntropometrica | null> {
  return queryOne<MedidaAntropometrica>('SELECT * FROM medidas_antropometricas WHERE data = ? ORDER BY id DESC LIMIT 1', [
    data,
  ])
}

export async function addMedida(medida: Omit<MedidaAntropometrica, 'id'>): Promise<void> {
  await run(
    `INSERT INTO medidas_antropometricas
       (data, hora, peso_kg, percentual_gordura, cintura_cm, quadril_cm, peito_cm, braco_cm, coxa_cm, pescoco_cm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      medida.data,
      medida.hora,
      medida.peso_kg,
      medida.percentual_gordura,
      medida.cintura_cm,
      medida.quadril_cm,
      medida.peito_cm,
      medida.braco_cm,
      medida.coxa_cm,
      medida.pescoco_cm,
    ],
  )
}

export async function updateMedida(id: number, medida: Omit<MedidaAntropometrica, 'id'>): Promise<void> {
  await run(
    `UPDATE medidas_antropometricas
     SET data = ?, hora = ?, peso_kg = ?, percentual_gordura = ?, cintura_cm = ?, quadril_cm = ?,
         peito_cm = ?, braco_cm = ?, coxa_cm = ?, pescoco_cm = ?
     WHERE id = ?`,
    [
      medida.data,
      medida.hora,
      medida.peso_kg,
      medida.percentual_gordura,
      medida.cintura_cm,
      medida.quadril_cm,
      medida.peito_cm,
      medida.braco_cm,
      medida.coxa_cm,
      medida.pescoco_cm,
      id,
    ],
  )
}

export async function deleteMedida(id: number): Promise<void> {
  await run('DELETE FROM medidas_antropometricas WHERE id = ?', [id])
}
