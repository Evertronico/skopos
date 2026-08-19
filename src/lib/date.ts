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
