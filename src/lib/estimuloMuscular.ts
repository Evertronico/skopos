import type { ExecucaoComGrupo } from '../db/repoTreino'
import type { GrupoMuscular, Objetivo } from '../db/types'

export type NivelEstimulo = 'nenhum' | 'baixo' | 'moderado' | 'adequado'

export const COR_NIVEL_ESTIMULO: Record<NivelEstimulo, string> = {
  nenhum: 'var(--surface-hover)',
  baixo: 'var(--danger)',
  moderado: 'var(--warning)',
  adequado: 'var(--highlight)',
}

export interface EstimuloGrupo {
  grupo: GrupoMuscular
  series: number
  sessoes: number
  nivel: NivelEstimulo
}

/**
 * Faixa de séries/semana por grupo muscular considerada adequada pra hipertrofia/força — a literatura
 * de treinamento converge em ~10-20 séries semanais por grupo para ganho de massa; objetivos de
 * manutenção/perda de peso pedem menos volume pra sustentar (o foco ali é preservar massa, não maximizar).
 */
const FAIXAS_POR_OBJETIVO: Record<Objetivo, { minAdequado: number; minAceitavel: number }> = {
  ganho_massa: { minAdequado: 10, minAceitavel: 6 },
  perda_peso: { minAdequado: 8, minAceitavel: 4 },
  manutencao: { minAdequado: 8, minAceitavel: 4 },
}

function nivelDoGrupo(series: number, sessoes: number, objetivo: Objetivo | null): NivelEstimulo {
  const faixa = FAIXAS_POR_OBJETIVO[objetivo ?? 'manutencao']
  if (series === 0) return 'nenhum'
  if (series < faixa.minAceitavel) return 'baixo'
  // Mesmo com volume ok, uma única sessão na semana é subótimo — evidência favorece distribuir
  // o estímulo em pelo menos 2 sessões pra cada grupo responder melhor ao longo da semana.
  if (series < faixa.minAdequado || sessoes < 2) return 'moderado'
  return 'adequado'
}

/** Agrega execuções concluídas da semana por grupo muscular e classifica o nível de estímulo de cada um. */
export function calcularEstimuloMuscular(
  execucoes: ExecucaoComGrupo[],
  gruposLocalizados: readonly GrupoMuscular[],
  objetivo: Objetivo | null,
): Record<string, EstimuloGrupo> {
  const porGrupo = new Map<string, { series: number; datas: Set<string> }>()
  for (const grupo of gruposLocalizados) porGrupo.set(grupo, { series: 0, datas: new Set() })

  for (const exec of execucoes) {
    const acumulado = porGrupo.get(exec.grupo)
    if (!acumulado) continue // grupo fora do mapa (ex.: "Corpo todo/Cardio")
    acumulado.series += exec.series_feitas ?? 0
    acumulado.datas.add(exec.data)
  }

  const resultado: Record<string, EstimuloGrupo> = {}
  for (const [grupo, { series, datas }] of porGrupo) {
    resultado[grupo] = {
      grupo: grupo as GrupoMuscular,
      series,
      sessoes: datas.size,
      nivel: nivelDoGrupo(series, datas.size, objetivo),
    }
  }
  return resultado
}
