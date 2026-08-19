export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function daysAgoISO(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}

export function formatDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function diasEntre(dataInicioISO: string, dataFimISO: string): number {
  const inicio = new Date(dataInicioISO).getTime()
  const fim = new Date(dataFimISO).getTime()
  return Math.round((fim - inicio) / (1000 * 60 * 60 * 24))
}

/** 0=domingo ... 6=sábado — mesma convenção de Date.getDay(). */
export const NOME_DIA_SEMANA: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

/** Ordem de exibição da ficha: Segunda a Domingo. */
export const ORDEM_DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 0] as const

export function diaSemanaDe(dataISO: string): number {
  return new Date(`${dataISO}T00:00:00`).getDay()
}
