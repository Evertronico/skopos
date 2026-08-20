import { useEffect, useState } from 'react'
import { MeasurementsChart, type ItemMedida } from '../../components/MeasurementsChart'
import { NutritionPlate } from '../../components/NutritionPlate'
import { WaterBottle } from '../../components/WaterBottle'
import { WeeklyTrainingChart } from '../../components/WeeklyTrainingChart'
import { IconDroplet, IconDumbbell, IconRuler, IconTarget } from '../../components/icons'
import { onDataChange } from '../../db/database'
import { listMedidas } from '../../db/repoMedidas'
import { getMetasMedidas } from '../../db/repoMetasMedidas'
import { getPerfil } from '../../db/repoPerfil'
import { getPlanoNutricional } from '../../db/repoPlanoNutricional'
import { listHidratacao, listNutricao, listSono } from '../../db/repoRegistros'
import { listExecucoes, listRegistrosTreino } from '../../db/repoTreino'
import type { MedidaAntropometrica, MetasMedidas, Perfil } from '../../db/types'
import { calcularMetas, derivarMacros } from '../../lib/calculations'
import { daysAgoISO, todayISO } from '../../lib/date'
import { scoreEvolucaoMedidas, scoreMediaContraMeta, scoreNutricao, scoreTreino, type RadarScores } from '../../lib/radar'

const SETE_DIAS_ATRAS = daysAgoISO(7)
const CATORZE_DIAS_ATRAS = daysAgoISO(14)

const CAMPOS_MEDIDA: { chave: Exclude<keyof MedidaAntropometrica, 'id' | 'data'>; label: string }[] = [
  { chave: 'peso_kg', label: 'Peso (kg)' },
  { chave: 'percentual_gordura', label: '% Gordura' },
  { chave: 'cintura_cm', label: 'Cintura (cm)' },
  { chave: 'quadril_cm', label: 'Quadril (cm)' },
  { chave: 'peito_cm', label: 'Peito (cm)' },
  { chave: 'braco_cm', label: 'Braço (cm)' },
  { chave: 'coxa_cm', label: 'Coxa (cm)' },
  { chave: 'pescoco_cm', label: 'Pescoço (cm)' },
]

function encontrarPesoProximo(medidas: MedidaAntropometrica[], dataAlvoISO: string): number | null {
  const comPeso = medidas.filter((m): m is MedidaAntropometrica & { peso_kg: number } => m.peso_kg !== null)
  if (comPeso.length === 0) return null
  const antesOuIgual = comPeso.find((m) => m.data <= dataAlvoISO)
  return (antesOuIgual ?? comPeso[comPeso.length - 1]).peso_kg
}

function percentual(valor: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.round((valor / meta) * 100)
}

export function DashboardPage() {
  const [atual, setAtual] = useState<RadarScores | null>(null)
  const [anterior, setAnterior] = useState<RadarScores | null>(null)
  const [semDados, setSemDados] = useState(false)

  const [aguaHojePct, setAguaHojePct] = useState(0)
  const [caloriasHojePct, setCaloriasHojePct] = useState(0)
  const [proteinaHojePct, setProteinaHojePct] = useState(0)
  const [carboHojePct, setCarboHojePct] = useState(0)
  const [gorduraHojePct, setGorduraHojePct] = useState(0)

  const [itensMedidas, setItensMedidas] = useState<ItemMedida[]>([])

  useEffect(() => {
    async function carregar() {
      const [perfil, medidas, metasMedidas, planoNutricional, treinos14, hidratacao14, sono14, nutricao14] =
        await Promise.all([
          getPerfil(),
          listMedidas(),
          getMetasMedidas(),
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
      const metasCalculadas = calcularMetas(perfil as Perfil, pesoHoje)
      const metas =
        planoNutricional?.calorias && planoNutricional.agua_ml && planoNutricional.sono_horas
          ? {
              calorias: planoNutricional.calorias,
              proteina_g: planoNutricional.proteina_g ?? 0,
              agua_ml: planoNutricional.agua_ml,
              sono_horas: planoNutricional.sono_horas,
              ...derivarMacros(planoNutricional.calorias),
            }
          : metasCalculadas

      // --- "hoje": garrafinha + prato ---
      const hoje = todayISO()
      const mlHoje = hidratacao14.filter((r) => r.data === hoje).reduce((s, r) => s + r.ml_consumido, 0)
      const registrosHoje = nutricao14.filter((r) => r.data === hoje)
      const caloriasHoje = registrosHoje.reduce((s, r) => s + (r.calorias ?? 0), 0)
      const proteinaHoje = registrosHoje.reduce((s, r) => s + (r.proteina_g ?? 0), 0)
      const carboHoje = registrosHoje.reduce((s, r) => s + (r.carboidrato_g ?? 0), 0)
      const gorduraHoje = registrosHoje.reduce((s, r) => s + (r.gordura_g ?? 0), 0)

      setAguaHojePct(percentual(mlHoje, metas.agua_ml))
      setCaloriasHojePct(percentual(caloriasHoje, metas.calorias))
      setProteinaHojePct(percentual(proteinaHoje, metas.proteina_g))
      setCarboHojePct(percentual(carboHoje, metas.carboidrato_g))
      setGorduraHojePct(percentual(gorduraHoje, metas.gordura_g))

      // --- medidas: atual x meta, só as que têm ao menos um registro ---
      const metaMedidasObj: MetasMedidas | null = metasMedidas
      const itens: ItemMedida[] = []
      for (const { chave, label } of CAMPOS_MEDIDA) {
        const registroComValor = medidas.find((m) => m[chave] !== null)
        if (!registroComValor) continue
        itens.push({
          label,
          atual: registroComValor[chave] as number,
          meta: metaMedidasObj?.[chave] ?? null,
        })
      }
      setItensMedidas(itens)

      // --- score semanal ---
      const execucoesPorRegistro = await Promise.all(treinos14.map((r) => listExecucoes(r.id)))
      const treinosComExecucoes = treinos14.map((r, i) => ({ ...r, execucoes: execucoesPorRegistro[i] }))

      const partirPorData = <T extends { data: string }>(itensData: T[]) => ({
        atual: itensData.filter((i) => i.data >= SETE_DIAS_ATRAS),
        anterior: itensData.filter((i) => i.data < SETE_DIAS_ATRAS && i.data >= CATORZE_DIAS_ATRAS),
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
        hidratacao: scoreMediaContraMeta(hidratacao.map((h) => h.ml_consumido), metas.agua_ml),
        sono: scoreMediaContraMeta(sono.map((s) => s.horas), metas.sono_horas),
        nutricao: scoreNutricao(nutricao.map((n) => n.calorias ?? 0).filter((c) => c > 0), metas.calorias),
        medidas: scoreEvolucaoMedidas(pesoRecente, pesoAntigo, perfil.objetivo),
      })

      setAtual(
        montarScores(treinosPart.atual, hidratacaoPart.atual, sonoPart.atual, nutricaoPart.atual, pesoHoje, pesoSeteDiasAtras),
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

    let timer: ReturnType<typeof setTimeout> | null = null
    const unsubscribe = onDataChange(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(carregar, 400)
    })

    return () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
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

  const scoreSemanal = Math.round(Object.values(atual).reduce((a, b) => a + b, 0) / 5)
  const mediaAnterior = Object.values(anterior).reduce((a, b) => a + b, 0) / 5
  const diferenca = scoreSemanal - mediaAnterior

  let tom: 'positivo' | 'negativo' | 'neutro' = 'neutro'
  let veredito = 'Estável — dá pra melhorar.'
  if (scoreSemanal >= 70) {
    veredito = 'No caminho certo! 🎯'
    tom = 'positivo'
  } else if (scoreSemanal < 40) {
    veredito = 'Fora do caminho — hora de ajustar.'
    tom = 'negativo'
  }

  let tendencia = 'Sem dados da semana anterior pra comparar.'
  if (mediaAnterior > 0) {
    if (diferenca > 3) tendencia = `Subiu ${diferenca.toFixed(0)} pontos em relação à semana passada.`
    else if (diferenca < -3) tendencia = `Caiu ${Math.abs(diferenca).toFixed(0)} pontos em relação à semana passada.`
    else tendencia = 'Estável em relação à semana passada.'
  }

  return (
    <div className="page">
      <h2>Dashboard</h2>

      <div className="card">
        <h3 className="card-title">
          <IconTarget size={18} /> Score semanal
        </h3>
        <div className="score-semanal">
          <span className="score-numero">{scoreSemanal}</span>
          <span className="score-max">/100</span>
        </div>
        <p className={`resultado-card ${tom}`}>{veredito}</p>
        <p className="hint">{tendencia}</p>
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconDroplet size={18} /> Hoje
        </h3>
        <div className="hoje-grid">
          <WaterBottle percentual={aguaHojePct} />
          <NutritionPlate
            calorias={caloriasHojePct}
            proteina={proteinaHojePct}
            carboidratos={carboHojePct}
            gordura={gorduraHojePct}
          />
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconRuler size={18} /> Medidas: atual × meta
        </h3>
        <MeasurementsChart itens={itensMedidas} />
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconDumbbell size={18} /> Treinos por semana
        </h3>
        <WeeklyTrainingChart />
      </div>
    </div>
  )
}
