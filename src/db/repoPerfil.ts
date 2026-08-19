import { queryOne, run } from './database'
import type { Perfil } from './types'

export async function getPerfil(): Promise<Perfil | null> {
  return queryOne<Perfil>('SELECT * FROM perfil WHERE id = 1')
}

export async function savePerfil(perfil: Omit<Perfil, 'id'>): Promise<void> {
  await run(
    `INSERT INTO perfil (id, nome, data_nascimento, sexo, tipo_sanguineo, altura_cm, objetivo, nivel_atividade)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome = excluded.nome,
       data_nascimento = excluded.data_nascimento,
       sexo = excluded.sexo,
       tipo_sanguineo = excluded.tipo_sanguineo,
       altura_cm = excluded.altura_cm,
       objetivo = excluded.objetivo,
       nivel_atividade = excluded.nivel_atividade`,
    [
      perfil.nome,
      perfil.data_nascimento,
      perfil.sexo,
      perfil.tipo_sanguineo,
      perfil.altura_cm,
      perfil.objetivo,
      perfil.nivel_atividade,
    ],
  )
}
