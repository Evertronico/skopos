import type { NivelAtividade, Objetivo, Perfil } from '../db/types'

const FATOR_ATIVIDADE: Record<NivelAtividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muito_intenso: 1.9,
}

export function calcularIdade(dataNascimento: string): number {
  const nascimento = new Date(dataNascimento)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversario) idade -= 1
  return idade
}

/** Taxa metabólica basal — fórmula de Mifflin-St Jeor. */
export function calcularTMB(perfil: Perfil, pesoKg: number): number | null {
  if (!perfil.data_nascimento || !perfil.altura_cm || !perfil.sexo) return null
  const idade = calcularIdade(perfil.data_nascimento)
  const base = 10 * pesoKg + 6.25 * perfil.altura_cm - 5 * idade
  return perfil.sexo === 'M' ? base + 5 : base - 161
}

export function calcularGastoDiario(perfil: Perfil, pesoKg: number): number | null {
  const tmb = calcularTMB(perfil, pesoKg)
  if (tmb === null || !perfil.nivel_atividade) return null
  return tmb * FATOR_ATIVIDADE[perfil.nivel_atividade]
}

const AJUSTE_CALORICO: Record<Objetivo, number> = {
  perda_peso: -500,
  ganho_massa: 300,
  manutencao: 0,
}

export interface MetasNutricionais {
  calorias: number
  proteina_g: number
  agua_ml: number
  sono_horas: number
}

export function calcularMetas(perfil: Perfil, pesoKg: number): MetasNutricionais | null {
  const gastoDiario = calcularGastoDiario(perfil, pesoKg)
  if (gastoDiario === null || !perfil.objetivo) return null

  const calorias = Math.round(gastoDiario + AJUSTE_CALORICO[perfil.objetivo])
  const gramasProteinaPorKg = perfil.objetivo === 'ganho_massa' ? 2.0 : 1.6
  const proteina_g = Math.round(pesoKg * gramasProteinaPorKg)
  const agua_ml = Math.round(pesoKg * 35)
  const idade = perfil.data_nascimento ? calcularIdade(perfil.data_nascimento) : 30
  const sono_horas = idade <= 17 ? 9 : 8

  return { calorias, proteina_g, agua_ml, sono_horas }
}

export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100
  return pesoKg / (alturaM * alturaM)
}
