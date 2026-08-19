import { useEffect, useState } from 'react'
import { RadarChart } from '../../components/RadarChart'
import { listMedidas } from '../../db/repoMedidas'
import { getPerfil } from '../../db/repoPerfil'
import { getPlanoNutricional } from '../../db/repoPlanoNutricional'
import { listHidratacao, listNutricao, listSono } from '../../db/repoRegistros'
import { listExecucoes, listRegistrosTreino } from '../../db/repoTreino'
import type { MedidaAntropometrica, Perfil } from '../../db/types'
import { calcularMetas } from '../../lib/calculations'
import { daysAgoISO, todayISO } from '../../lib/date'
import { scoreEvolucaoMedidas, scoreMediaContraMeta, scoreNutricao, scoreTreino, type RadarScores } from '../../lib/radar'

const SETE_DIAS_ATRAS = daysAgoISO(7)
const CATORZE_DIAS_ATRAS = daysAgoISO(14)

function encontrarPesoProximo(medidas: MedidaAntropometrica[], dataAlvoISO: string): number | null {
  const comPeso = medidas.filter((m): m is MedidaAntropometrica & { peso_kg: number } => m.peso_kg !== null)
  if (comPeso.length === 0) return null
  const antesOuIgual = comPeso.find((m) => m.data <= dataAlvoISO)
  return (antesOuIgual ?? comPeso[comPeso.length - 1]).peso_kg
}

export function DashboardPage() {
  const [atual, setAtual] = useState<RadarScores | null>(null)
  const [anterior, setAnterior] = useState<RadarScores | null>(null)
  const [semDados, setSemDados] = useState(false)

  useEffect(() => {
    async function carregar() {
      const [perfil, medidas, planoNutricional, treinos14, hidratacao14, sono14, nutricao14] = await Promise.all([
        getPerfil(),
        listMedidas(),
        getPlanoNutricional(),
        listRegistrosTreino(14),
        listHidratacao(14),
        listSono(14),
        listNutricao(14),
      ])

      if (!perfil) {
        setSemDados(true)
        return
      }

      const pesoHoje = encontrarPesoProximo(medidas, todayISO())
      const metasCalculadas = pesoHoje ? calcularMetas(perfil as Perfil, pesoHoje) : null
      const metas =
        planoNutricional?.calorias && planoNutricional.agua_ml && planoNutricional.sono_horas
          ? {
              calorias: planoNutricional.calorias,
              proteina_g: planoNutricional.proteina_g ?? 0,
              agua_ml: planoNutricional.agua_ml,
              sono_horas: planoNutricional.sono_horas,
            }
          : metasCalculadas

      const execucoesPorRegistro = await Promise.all(treinos14.map((r) => listExecucoes(r.id)))
      const treinosComExecucoes = treinos14.map((r, i) => ({ ...r, execucoes: execucoesPorRegistro[i] }))

      const partirPorData = <T extends { data: string }>(itens: T[]) => ({
        atual: itens.filter((i) => i.data >= SETE_DIAS_ATRAS),
        anterior: itens.filter((i) => i.data < SETE_DIAS_ATRAS && i.data >= CATORZE_DIAS_ATRAS),
      })

      const treinosPart = partirPorData(treinosComExecucoes)
      const hidratacaoPart = partirPorData(hidratacao14)
      const sonoPart = partirPorData(sono14)
      const nutricaoPart = partirPorData(nutricao14)

      const pesoSeteDiasAtras = encontrarPesoProximo(medidas, SETE_DIAS_ATRAS)
      const pesoCatorzeDiasAtras = encontrarPesoProximo(medidas, CATORZE_DIAS_ATRAS)

      const montarScores = (
        treinos: typeof treinosComExecucoes,
        hidratacao: typeof hidratacao14,
        sono: typeof sono14,
        nutricao: typeof nutricao14,
        pesoRecente: number | null,
        pesoAntigo: number | null,
      ): RadarScores => ({
        treino: scoreTreino(treinos.flatMap((r) => r.execucoes)),
        hidratacao: metas ? scoreMediaContraMeta(hidratacao.map((h) => h.ml_consumido), metas.agua_ml) : 0,
        sono: metas ? scoreMediaContraMeta(sono.map((s) => s.horas), metas.sono_horas) : 0,
        nutricao: metas
          ? scoreNutricao(nutricao.map((n) => n.calorias ?? 0).filter((c) => c > 0), metas.calorias)
          : 0,
        medidas: scoreEvolucaoMedidas(pesoRecente, pesoAntigo, perfil.objetivo),
      })

      setAtual(
        montarScores(
          treinosPart.atual,
          hidratacaoPart.atual,
          sonoPart.atual,
          nutricaoPart.atual,
          pesoHoje,
          pesoSeteDiasAtras,
        ),
      )
      setAnterior(
        montarScores(
          treinosPart.anterior,
          hidratacaoPart.anterior,
          sonoPart.anterior,
          nutricaoPart.anterior,
          pesoSeteDiasAtras,
          pesoCatorzeDiasAtras,
        ),
      )
    }

    carregar()
  }, [])

  if (semDados) {
    return (
      <div className="page">
        <h2>Dashboard</h2>
        <p className="hint">Preencha seu perfil primeiro para ver o dashboard.</p>
      </div>
    )
  }

  if (!atual || !anterior) return <p>Carregando...</p>

  const mediaAtual = Object.values(atual).reduce((a, b) => a + b, 0) / 5
  const mediaAnterior = Object.values(anterior).reduce((a, b) => a + b, 0) / 5
  const diferenca = mediaAtual - mediaAnterior

  let mensagem = 'Sem dados suficientes na semana anterior para comparar.'
  if (mediaAnterior > 0) {
    if (diferenca > 3) mensagem = `Você está evoluindo — pontuação subiu ${diferenca.toFixed(0)} pontos.`
    else if (diferenca < -3) mensagem = `Atenção — pontuação caiu ${Math.abs(diferenca).toFixed(0)} pontos.`
    else mensagem = 'Estável em relação à semana anterior.'
  }

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <RadarChart atual={atual} anterior={anterior} />
      <p className="hint">{mensagem}</p>
    </div>
  )
}
