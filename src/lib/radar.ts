import type { Objetivo } from '../db/types'

export interface RadarScores {
  treino: number
  hidratacao: number
  sono: number
  nutricao: number
  medidas: number
}

export function scoreTreino(execucoes: { concluido: number }[]): number {
  if (execucoes.length === 0) return 0
  const concluidas = execucoes.filter((e) => e.concluido).length
  return Math.round((concluidas / execucoes.length) * 100)
}

/**
 * Soma os valores por data antes de pontuar. Sem isso, quem registra água/comida em vários lançamentos
 * por dia (o normal) tem cada lançamento comparado sozinho contra a meta do dia inteiro, e a média
 * despenca artificialmente — o score deixa de refletir a adesão real.
 */
export function agruparPorDia<T extends { data: string }>(itens: T[], valor: (item: T) => number): number[] {
  const porDia = new Map<string, number>()
  for (const item of itens) {
    porDia.set(item.data, (porDia.get(item.data) ?? 0) + valor(item))
  }
  return Array.from(porDia.values())
}

export function scoreMediaContraMeta(valores: number[], meta: number): number {
  if (valores.length === 0 || meta <= 0) return 0
  const media = valores.reduce((a, b) => a + b, 0) / valores.length
  return Math.round(Math.min(100, (media / meta) * 100))
}

export function scoreNutricao(caloriasRegistradas: number[], metaCalorias: number): number {
  if (caloriasRegistradas.length === 0 || metaCalorias <= 0) return 0
  const proximidades = caloriasRegistradas.map((c) => {
    const desvio = Math.abs(c - metaCalorias) / metaCalorias
    return Math.max(0, 1 - desvio)
  })
  const media = proximidades.reduce((a, b) => a + b, 0) / proximidades.length
  return Math.round(media * 100)
}

/** Compara o peso atual com o peso de ~7 dias atrás em relação ao ritmo saudável esperado pro objetivo. */
export function scoreEvolucaoMedidas(
  pesoAtual: number | null,
  pesoSemanaAnterior: number | null,
  objetivo: Objetivo | null,
): number {
  if (pesoAtual === null || pesoSemanaAnterior === null || !objetivo) return 50

  const deltaSemanal = pesoAtual - pesoSemanaAnterior

  if (objetivo === 'manutencao') {
    const desvio = Math.abs(deltaSemanal)
    return Math.round(Math.max(0, 100 - desvio * 100))
  }

  const metaSemanal = objetivo === 'perda_peso' ? -0.5 : 0.25
  const progresso = deltaSemanal / metaSemanal
  return Math.round(Math.max(0, Math.min(100, progresso * 100)))
}
