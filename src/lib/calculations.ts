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

const AJUSTE_CALORICO: Record<Objetivo, number> = {
  perda_peso: -500,
  ganho_massa: 300,
  manutencao: 0,
}

export interface MetasNutricionais {
  calorias: number
  proteina_g: number
  carboidrato_g: number
  gordura_g: number
  agua_ml: number
  sono_horas: number
}

/** Deriva metas de carboidrato/gordura a partir das calorias — 45% carbo, 25% gordura, o resto vem da proteína. */
export function derivarMacros(calorias: number): { carboidrato_g: number; gordura_g: number } {
  return {
    carboidrato_g: Math.round((calorias * 0.45) / 4),
    gordura_g: Math.round((calorias * 0.25) / 9),
  }
}

/**
 * Sempre retorna uma estimativa usável, mesmo com o perfil incompleto — usa médias populacionais
 * como ponto de partida (peso 70kg, altura 170cm, atividade moderada, manutenção) e refina conforme
 * o usuário preenche o perfil de verdade e registra o peso. Sem isso, metas nunca calculam e os
 * eixos de hidratação/sono/nutrição do dashboard ficam travados em 0% pra sempre.
 */
export function calcularMetas(perfil: Perfil, pesoKg: number | null): MetasNutricionais {
  const peso = pesoKg ?? 70
  const altura = perfil.altura_cm ?? 170
  const sexo = perfil.sexo ?? 'M'
  const nivelAtividade = perfil.nivel_atividade ?? 'moderado'
  const objetivo = perfil.objetivo ?? 'manutencao'
  const idade = perfil.data_nascimento ? calcularIdade(perfil.data_nascimento) : 30

  const tmbBase = 10 * peso + 6.25 * altura - 5 * idade
  const tmb = sexo === 'M' ? tmbBase + 5 : tmbBase - 161
  const gastoDiario = tmb * FATOR_ATIVIDADE[nivelAtividade]

  const calorias = Math.round(gastoDiario + AJUSTE_CALORICO[objetivo])
  const gramasProteinaPorKg = objetivo === 'ganho_massa' ? 2.0 : 1.6
  const proteina_g = Math.round(peso * gramasProteinaPorKg)
  const agua_ml = Math.round(peso * 35)
  const sono_horas = idade <= 17 ? 9 : 8
  const { carboidrato_g, gordura_g } = derivarMacros(calorias)

  return { calorias, proteina_g, carboidrato_g, gordura_g, agua_ml, sono_horas }
}

export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100
  return pesoKg / (alturaM * alturaM)
}
