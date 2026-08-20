export type Tema = 'dark' | 'light'

const CHAVE_TEMA = 'skopos-tema'

export function lerTemaSalvo(): Tema {
  const salvo = localStorage.getItem(CHAVE_TEMA)
  return salvo === 'light' ? 'light' : 'dark'
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.setAttribute('data-theme', tema)
  localStorage.setItem(CHAVE_TEMA, tema)
}
