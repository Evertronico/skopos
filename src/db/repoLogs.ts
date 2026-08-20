import { run } from './database'
import type { TipoLogTreino } from './types'

export async function registrarLog(
  tipo: TipoLogTreino,
  registroTreinoId: number | null,
  detalhe: string | null = null,
): Promise<void> {
  await run('INSERT INTO logs_treino (registro_treino_id, tipo, detalhe, criado_em) VALUES (?, ?, ?, ?)', [
    registroTreinoId,
    tipo,
    detalhe,
    new Date().toISOString(),
  ])
}
