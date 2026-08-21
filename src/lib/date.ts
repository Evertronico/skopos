function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** YYYY-MM-DD no fuso LOCAL do dispositivo — nunca use toISOString() pra isso, ele converte pra UTC e desloca o dia perto da virada. */
export function paraISOLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function todayISO(): string {
  return paraISOLocal(new Date())
}

/** HH:MM no horário local, pra pré-preencher o campo de hora de um novo registro. */
export function nowHHMM(): string {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function daysAgoISO(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return paraISOLocal(d)
}

export function adicionarDias(dataISO: string, delta: number): string {
  const d = new Date(`${dataISO}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return paraISOLocal(d)
}

export function formatDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatDataHoraBR(iso: string, hora: string | null): string {
  return hora ? `${formatDataBR(iso)} ${hora}` : formatDataBR(iso)
}

/** Rótulo amigável: "Hoje", "Ontem" ou a data por extenso. */
export function rotuloDia(dataISO: string): string {
  if (dataISO === todayISO()) return 'Hoje'
  if (dataISO === adicionarDias(todayISO(), -1)) return 'Ontem'
  if (dataISO === adicionarDias(todayISO(), 1)) return 'Amanhã'
  return formatDataBR(dataISO)
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
