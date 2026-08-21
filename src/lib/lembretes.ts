import { listMedidas } from '../db/repoMedidas'
import { getPerfil } from '../db/repoPerfil'
import { getPlanoNutricional } from '../db/repoPlanoNutricional'
import { listHidratacaoDoDia, listNutricaoDoDia } from '../db/repoRegistros'
import { listRegistrosTreino } from '../db/repoTreino'
import type { Perfil } from '../db/types'
import { calcularMetas, derivarMacros } from './calculations'
import { diasEntre, todayISO } from './date'
import { notificar, permissaoNotificacao } from './notifications'

const JANELA_INICIO_H = 7
const JANELA_FIM_H = 22
const INTERVALO_MIN_AGUA_H = 2
const INTERVALO_MIN_REFEICAO_H = 3.5
const DIAS_AUSENCIA_LIMITE = 2

const CHAVE_ULT_LEMBRETE_AGUA = 'skopos_ultimo_lembrete_agua'
const CHAVE_ULT_LEMBRETE_REFEICAO = 'skopos_ultimo_lembrete_refeicao'
const CHAVE_ULT_LEMBRETE_AUSENCIA = 'skopos_ultimo_lembrete_ausencia'

function horasDesde(isoOuNull: string | null): number {
  if (!isoOuNull) return Infinity
  const t = new Date(isoOuNull).getTime()
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / 3_600_000
}

function podeNotificarDeNovo(chave: string, minIntervaloH: number): boolean {
  return horasDesde(localStorage.getItem(chave)) >= minIntervaloH
}

function marcarNotificado(chave: string): void {
  localStorage.setItem(chave, new Date().toISOString())
}

/**
 * Roda periodicamente enquanto o app está aberto (não funciona com o app fechado — isso exigiria
 * push de servidor). Compara o ritmo do dia contra a meta e avisa com uma dose sugerida quando o
 * usuário está atrasado, e avisa se faz tempo demais sem treinar.
 */
export async function verificarLembretes(): Promise<void> {
  if (permissaoNotificacao() !== 'granted') return

  const agora = new Date()
  const horaAtual = agora.getHours() + agora.getMinutes() / 60
  if (horaAtual < JANELA_INICIO_H || horaAtual > JANELA_FIM_H) return

  const hoje = todayISO()
  const [perfil, medidas, planoNutricional, hidratacaoHoje, nutricaoHoje, treinosRecentes] = await Promise.all([
    getPerfil(),
    listMedidas(),
    getPlanoNutricional(),
    listHidratacaoDoDia(hoje),
    listNutricaoDoDia(hoje),
    listRegistrosTreino(30),
  ])
  if (!perfil) return

  const pesoAtual = medidas.find((m) => m.peso_kg !== null)?.peso_kg ?? null
  const metasCalculadas = calcularMetas(perfil as Perfil, pesoAtual)
  const metas =
    planoNutricional?.calorias && planoNutricional.agua_ml
      ? {
          calorias: planoNutricional.calorias,
          agua_ml: planoNutricional.agua_ml,
          ...derivarMacros(planoNutricional.calorias),
        }
      : metasCalculadas

  // --- Hidratação: ritmo esperado até agora dentro da janela de vigília ---
  const mlHoje = hidratacaoHoje.reduce((soma, r) => soma + r.ml_consumido, 0)
  const janelaTotal = JANELA_FIM_H - JANELA_INICIO_H
  const ritmoEsperado = metas.agua_ml * (Math.max(0, horaAtual - JANELA_INICIO_H) / janelaTotal)
  // listHidratacaoDoDia ordena por hora DESC — o primeiro item é o mais recente.
  const horaUltimaAgua = hidratacaoHoje[0]?.hora ? `${hoje}T${hidratacaoHoje[0].hora}` : null

  if (
    mlHoje < ritmoEsperado - 300 &&
    horasDesde(horaUltimaAgua) >= INTERVALO_MIN_AGUA_H &&
    podeNotificarDeNovo(CHAVE_ULT_LEMBRETE_AGUA, INTERVALO_MIN_AGUA_H)
  ) {
    const sugestao = Math.min(500, Math.max(200, Math.round((metas.agua_ml - mlHoje) / 4 / 50) * 50))
    await notificar('Hora de se hidratar 💧', {
      body: `Você está abaixo do ritmo de hoje. Sugestão: ~${sugestao}ml agora.`,
      tag: 'lembrete-agua',
    })
    marcarNotificado(CHAVE_ULT_LEMBRETE_AGUA)
  }

  // --- Refeição: tempo desde a última + quanto falta pra meta calórica do dia ---
  const caloriasHoje = nutricaoHoje.reduce((soma, r) => soma + (r.calorias ?? 0), 0)
  const horaUltimaRefeicao = nutricaoHoje[0]?.hora ? `${hoje}T${nutricaoHoje[0].hora}` : null

  if (
    caloriasHoje < metas.calorias * 0.9 &&
    horasDesde(horaUltimaRefeicao) >= INTERVALO_MIN_REFEICAO_H &&
    podeNotificarDeNovo(CHAVE_ULT_LEMBRETE_REFEICAO, INTERVALO_MIN_REFEICAO_H)
  ) {
    const restante = Math.max(0, metas.calorias - caloriasHoje)
    const sugestao = Math.round(Math.min(restante, Math.max(300, metas.calorias * 0.22)) / 50) * 50
    await notificar('Hora de comer 🍽️', {
      body: `Já faz um tempo desde a última refeição. Sugestão: ~${sugestao}kcal com proteína.`,
      tag: 'lembrete-refeicao',
    })
    marcarNotificado(CHAVE_ULT_LEMBRETE_REFEICAO)
  }

  // --- Ausência de treino: dias desde o último registro (qualquer ficha) ---
  if (treinosRecentes.length > 0) {
    const ultimaData = treinosRecentes[0].data // listRegistrosTreino ordena por data DESC
    const dias = diasEntre(ultimaData, hoje)
    if (dias >= DIAS_AUSENCIA_LIMITE && podeNotificarDeNovo(CHAVE_ULT_LEMBRETE_AUSENCIA, 20)) {
      await notificar('Sentimos sua falta no treino 🏋️', {
        body: `Já são ${dias} dias sem treinar. Bora retomar hoje?`,
        tag: 'lembrete-ausencia',
      })
      marcarNotificado(CHAVE_ULT_LEMBRETE_AUSENCIA)
    }
  }
}
