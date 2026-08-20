/** Resolve uma CSS custom property pro valor real — necessário porque canvas (Chart.js) não entende var(). */
export function corCss(nomeVar: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nomeVar).trim()
}
