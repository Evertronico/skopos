import { useEffect, useState } from 'react'
import { FloatingInput } from '../../components/FloatingInput'
import { IconDroplet, IconMoon, IconTarget, IconUtensils } from '../../components/icons'
import { listMedidas } from '../../db/repoMedidas'
import { getPerfil } from '../../db/repoPerfil'
import { getPlanoNutricional, removerPlanoNutricional, salvarPlanoNutricional } from '../../db/repoPlanoNutricional'
import {
  addHidratacao,
  addNutricao,
  addSono,
  buscarUltimaRefeicaoPorDescricao,
  listDescricoesRefeicoesSugeridas,
  listHidratacao,
  listNutricao,
  listSono,
} from '../../db/repoRegistros'
import type { Perfil, RegistroHidratacao, RegistroNutricao, RegistroSono } from '../../db/types'
import { calcularMetas, type MetasNutricionais } from '../../lib/calculations'
import { formatDataBR, todayISO } from '../../lib/date'

type PlanoEditavel = { calorias: number | ''; proteina_g: number | ''; agua_ml: number | ''; sono_horas: number | '' }
const PLANO_VAZIO: PlanoEditavel = { calorias: '', proteina_g: '', agua_ml: '', sono_horas: '' }

function percentual(valor: number, meta: number | null): number | null {
  if (!meta || meta <= 0) return null
  return Math.round((valor / meta) * 100)
}

export function NutricaoPage() {
  const [metasCalculadas, setMetasCalculadas] = useState<MetasNutricionais | null>(null)
  const [planoManual, setPlanoManual] = useState<PlanoEditavel | null>(null)
  const [editandoPlano, setEditandoPlano] = useState(false)
  const [formPlano, setFormPlano] = useState<PlanoEditavel>(PLANO_VAZIO)

  const [hidratacao, setHidratacao] = useState<RegistroHidratacao[]>([])
  const [sono, setSono] = useState<RegistroSono[]>([])
  const [nutricao, setNutricao] = useState<RegistroNutricao[]>([])
  const [sugestoesRefeicao, setSugestoesRefeicao] = useState<string[]>([])

  const [mlHoje, setMlHoje] = useState<number | ''>(250)
  const [horasSono, setHorasSono] = useState<number | ''>(8)
  const [qualidadeSono, setQualidadeSono] = useState(3)
  const [descricaoRefeicao, setDescricaoRefeicao] = useState('')
  const [calorias, setCalorias] = useState<number | ''>('')
  const [proteina, setProteina] = useState<number | ''>('')

  async function recarregar() {
    const [perfil, medidas, plano, h, s, n, sugestoes] = await Promise.all([
      getPerfil(),
      listMedidas(),
      getPlanoNutricional(),
      listHidratacao(),
      listSono(),
      listNutricao(),
      listDescricoesRefeicoesSugeridas(),
    ])
    const pesoAtual = medidas.find((m) => m.peso_kg !== null)?.peso_kg ?? null
    if (perfil) setMetasCalculadas(calcularMetas(perfil as Perfil, pesoAtual))

    if (plano) {
      setPlanoManual({
        calorias: plano.calorias ?? '',
        proteina_g: plano.proteina_g ?? '',
        agua_ml: plano.agua_ml ?? '',
        sono_horas: plano.sono_horas ?? '',
      })
    } else {
      setPlanoManual(null)
    }

    setHidratacao(h)
    setSono(s)
    setNutricao(n)
    setSugestoesRefeicao(sugestoes)
  }

  useEffect(() => {
    recarregar()
  }, [])

  const metas: MetasNutricionais | null = planoManual
    ? {
        calorias: Number(planoManual.calorias) || 0,
        proteina_g: Number(planoManual.proteina_g) || 0,
        agua_ml: Number(planoManual.agua_ml) || 0,
        sono_horas: Number(planoManual.sono_horas) || 0,
      }
    : metasCalculadas

  function abrirEdicaoPlano() {
    setFormPlano(
      planoManual ?? {
        calorias: metasCalculadas?.calorias ?? '',
        proteina_g: metasCalculadas?.proteina_g ?? '',
        agua_ml: metasCalculadas?.agua_ml ?? '',
        sono_horas: metasCalculadas?.sono_horas ?? '',
      },
    )
    setEditandoPlano(true)
  }

  async function handleSalvarPlano(e: React.FormEvent) {
    e.preventDefault()
    await salvarPlanoNutricional({
      calorias: formPlano.calorias === '' ? null : Number(formPlano.calorias),
      proteina_g: formPlano.proteina_g === '' ? null : Number(formPlano.proteina_g),
      agua_ml: formPlano.agua_ml === '' ? null : Number(formPlano.agua_ml),
      sono_horas: formPlano.sono_horas === '' ? null : Number(formPlano.sono_horas),
    })
    setEditandoPlano(false)
    await recarregar()
  }

  async function handleUsarCalculoAutomatico() {
    await removerPlanoNutricional()
    setEditandoPlano(false)
    await recarregar()
  }

  async function handleAddHidratacao(e: React.FormEvent) {
    e.preventDefault()
    if (mlHoje === '') return
    await addHidratacao(todayISO(), mlHoje)
    await recarregar()
  }

  async function handleAddSono(e: React.FormEvent) {
    e.preventDefault()
    if (horasSono === '') return
    await addSono(todayISO(), horasSono, qualidadeSono)
    await recarregar()
  }

  async function handleDescricaoChange(valor: string) {
    setDescricaoRefeicao(valor)
    if (calorias !== '' || proteina !== '') return
    const anterior = await buscarUltimaRefeicaoPorDescricao(valor)
    if (anterior) {
      setCalorias(anterior.calorias ?? '')
      setProteina(anterior.proteina_g ?? '')
    }
  }

  async function handleAddNutricao(e: React.FormEvent) {
    e.preventDefault()
    if (calorias === '' || !descricaoRefeicao.trim()) return
    await addNutricao({
      data: todayISO(),
      descricao: descricaoRefeicao.trim(),
      calorias: Number(calorias),
      proteina_g: proteina === '' ? null : Number(proteina),
      carboidrato_g: null,
      gordura_g: null,
    })
    setDescricaoRefeicao('')
    setCalorias('')
    setProteina('')
    await recarregar()
  }

  const hoje = todayISO()
  const mlHojeTotal = hidratacao.filter((r) => r.data === hoje).reduce((soma, r) => soma + r.ml_consumido, 0)
  const caloriasHojeTotal = nutricao
    .filter((r) => r.data === hoje)
    .reduce((soma, r) => soma + (r.calorias ?? 0), 0)
  const proteinaHojeTotal = nutricao
    .filter((r) => r.data === hoje)
    .reduce((soma, r) => soma + (r.proteina_g ?? 0), 0)
  const sonoHoje = sono.find((r) => r.data === hoje)?.horas ?? null

  return (
    <div className="page">
      <h2>Nutrição</h2>

      <div className="card">
        <h3 className="card-title">
          <IconTarget size={18} /> Metas do dia
        </h3>

        {!metas && !editandoPlano && (
          <p className="hint">
            Preencha o perfil e registre ao menos uma medida de peso pra calcular metas automaticamente, ou
            defina um plano manual.
          </p>
        )}

        {metas && !editandoPlano && (
          <>
            <div className="metas-grid">
              <div className="meta-card">
                <span className="meta-valor">{metas.calorias}</span>
                <span className="meta-rotulo">kcal/dia</span>
                {percentual(caloriasHojeTotal, metas.calorias) !== null && (
                  <span className="badge">{percentual(caloriasHojeTotal, metas.calorias)}% hoje</span>
                )}
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.proteina_g}g</span>
                <span className="meta-rotulo">proteína/dia</span>
                {percentual(proteinaHojeTotal, metas.proteina_g) !== null && (
                  <span className="badge">{percentual(proteinaHojeTotal, metas.proteina_g)}% hoje</span>
                )}
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.agua_ml}ml</span>
                <span className="meta-rotulo">água/dia</span>
                {percentual(mlHojeTotal, metas.agua_ml) !== null && (
                  <span className="badge">{percentual(mlHojeTotal, metas.agua_ml)}% hoje</span>
                )}
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.sono_horas}h</span>
                <span className="meta-rotulo">sono/dia</span>
                {sonoHoje !== null && <span className="badge">{sonoHoje}h hoje</span>}
              </div>
            </div>
            <p className="hint">
              {planoManual ? 'Plano definido manualmente.' : 'Meta calculada automaticamente a partir do perfil.'}{' '}
              <button className="link" onClick={abrirEdicaoPlano}>
                editar plano
              </button>
            </p>
          </>
        )}

        {editandoPlano && (
          <form className="form-page" onSubmit={handleSalvarPlano}>
            <div className="campos-grid">
              <FloatingInput
                label="Calorias/dia"
                type="number"
                inputMode="numeric"
                value={formPlano.calorias}
                onChange={(e) =>
                  setFormPlano({ ...formPlano, calorias: e.target.value ? Number(e.target.value) : '' })
                }
              />
              <FloatingInput
                label="Proteína (g/dia)"
                type="number"
                inputMode="decimal"
                value={formPlano.proteina_g}
                onChange={(e) =>
                  setFormPlano({ ...formPlano, proteina_g: e.target.value ? Number(e.target.value) : '' })
                }
              />
              <FloatingInput
                label="Água (ml/dia)"
                type="number"
                inputMode="numeric"
                value={formPlano.agua_ml}
                onChange={(e) =>
                  setFormPlano({ ...formPlano, agua_ml: e.target.value ? Number(e.target.value) : '' })
                }
              />
              <FloatingInput
                label="Sono (horas/dia)"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={formPlano.sono_horas}
                onChange={(e) =>
                  setFormPlano({ ...formPlano, sono_horas: e.target.value ? Number(e.target.value) : '' })
                }
              />
            </div>
            <div className="botoes-linha">
              <button type="submit" className="btn-primary">
                Salvar plano
              </button>
              <button type="button" onClick={() => setEditandoPlano(false)}>
                Cancelar
              </button>
              {planoManual && (
                <button type="button" onClick={handleUsarCalculoAutomatico}>
                  Usar cálculo automático
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconDroplet size={18} /> Hidratação
        </h3>
        <form className="inline-form" onSubmit={handleAddHidratacao}>
          <FloatingInput
            label="ml"
            type="number"
            inputMode="numeric"
            value={mlHoje}
            onChange={(e) => setMlHoje(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <button type="submit" className="btn-primary">
            Registrar
          </button>
        </form>
        {hidratacao.length > 0 && (
          <ul className="list-compact">
            {hidratacao.slice(0, 4).map((r) => (
              <li key={r.id}>
                {formatDataBR(r.data)} — {r.ml_consumido}ml
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconMoon size={18} /> Sono
        </h3>
        <form className="inline-form" onSubmit={handleAddSono}>
          <FloatingInput
            label="horas"
            type="number"
            inputMode="decimal"
            step="0.5"
            value={horasSono}
            onChange={(e) => setHorasSono(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <select value={qualidadeSono} onChange={(e) => setQualidadeSono(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                qualidade {n}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            Registrar
          </button>
        </form>
        {sono.length > 0 && (
          <ul className="list-compact">
            {sono.slice(0, 4).map((r) => (
              <li key={r.id}>
                {formatDataBR(r.data)} — {r.horas}h (qualidade {r.qualidade})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconUtensils size={18} /> Refeições
        </h3>
        <form className="form-page" onSubmit={handleAddNutricao}>
          <FloatingInput
            label="Descrição da refeição"
            type="text"
            list="refeicoes-sugeridas"
            value={descricaoRefeicao}
            onChange={(e) => handleDescricaoChange(e.target.value)}
            autoComplete="off"
          />
          <datalist id="refeicoes-sugeridas">
            {sugestoesRefeicao.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <div className="campos-grid">
            <FloatingInput
              label="Calorias"
              type="number"
              inputMode="numeric"
              value={calorias}
              onChange={(e) => setCalorias(e.target.value ? Number(e.target.value) : '')}
            />
            <FloatingInput
              label="Proteína (g)"
              type="number"
              inputMode="decimal"
              value={proteina}
              onChange={(e) => setProteina(e.target.value ? Number(e.target.value) : '')}
            />
          </div>

          <button type="submit" className="btn-primary">
            Registrar refeição
          </button>
        </form>

        {nutricao.length > 0 && (
          <ul className="list-compact">
            {nutricao.slice(0, 5).map((r) => (
              <li key={r.id}>
                {formatDataBR(r.data)} — {r.descricao ?? 'refeição'}: {r.calorias}kcal, {r.proteina_g ?? '—'}g
                proteína
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
