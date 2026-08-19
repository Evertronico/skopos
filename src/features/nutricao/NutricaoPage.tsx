import { useEffect, useState } from 'react'
import { listMedidas } from '../../db/repoMedidas'
import { getPerfil } from '../../db/repoPerfil'
import { getPlanoNutricional, removerPlanoNutricional, salvarPlanoNutricional } from '../../db/repoPlanoNutricional'
import { addHidratacao, addNutricao, addSono, listHidratacao, listNutricao, listSono } from '../../db/repoRegistros'
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

  const [mlHoje, setMlHoje] = useState(250)
  const [horasSono, setHorasSono] = useState(8)
  const [qualidadeSono, setQualidadeSono] = useState(3)
  const [calorias, setCalorias] = useState<number | ''>('')
  const [proteina, setProteina] = useState<number | ''>('')

  async function recarregar() {
    const [perfil, medidas, plano, h, s, n] = await Promise.all([
      getPerfil(),
      listMedidas(),
      getPlanoNutricional(),
      listHidratacao(),
      listSono(),
      listNutricao(),
    ])
    const pesoAtual = medidas[0]?.peso_kg
    if (perfil && pesoAtual) setMetasCalculadas(calcularMetas(perfil as Perfil, pesoAtual))

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
    await addHidratacao(todayISO(), mlHoje)
    await recarregar()
  }

  async function handleAddSono(e: React.FormEvent) {
    e.preventDefault()
    await addSono(todayISO(), horasSono, qualidadeSono)
    await recarregar()
  }

  async function handleAddNutricao(e: React.FormEvent) {
    e.preventDefault()
    if (calorias === '') return
    await addNutricao({
      data: todayISO(),
      calorias: Number(calorias),
      proteina_g: proteina === '' ? null : Number(proteina),
      carboidrato_g: null,
      gordura_g: null,
    })
    setCalorias('')
    setProteina('')
    await recarregar()
  }

  const hoje = todayISO()
  const mlHojeTotal = hidratacao.filter((r) => r.data === hoje).reduce((soma, r) => soma + r.ml_consumido, 0)
  const caloriasHojeTotal = nutricao
    .filter((r) => r.data === hoje)
    .reduce((soma, r) => soma + (r.calorias ?? 0), 0)
  const sonoHoje = sono.find((r) => r.data === hoje)?.horas ?? null

  return (
    <div className="page">
      <h2>Nutrição, hidratação e sono</h2>

      {!metas && !editandoPlano && (
        <p className="hint">
          Preencha o perfil e registre ao menos uma medida de peso para calcular suas metas automaticamente, ou
          defina um plano manual abaixo.
        </p>
      )}

      {metas && !editandoPlano && (
        <>
          <div className="metas-grid">
            <div className="meta-card">
              <span className="meta-valor">{metas.calorias}</span>
              <span className="meta-rotulo">kcal/dia {percentual(caloriasHojeTotal, metas.calorias) !== null && `(${percentual(caloriasHojeTotal, metas.calorias)}% hoje)`}</span>
            </div>
            <div className="meta-card">
              <span className="meta-valor">{metas.proteina_g}g</span>
              <span className="meta-rotulo">proteína/dia</span>
            </div>
            <div className="meta-card">
              <span className="meta-valor">{metas.agua_ml}ml</span>
              <span className="meta-rotulo">água/dia {percentual(mlHojeTotal, metas.agua_ml) !== null && `(${percentual(mlHojeTotal, metas.agua_ml)}% hoje)`}</span>
            </div>
            <div className="meta-card">
              <span className="meta-valor">{metas.sono_horas}h</span>
              <span className="meta-rotulo">sono/dia {sonoHoje !== null && `(${sonoHoje}h hoje)`}</span>
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
          <h3>Plano nutricional</h3>
          <label>
            Calorias/dia
            <input
              type="number"
              value={formPlano.calorias}
              onChange={(e) => setFormPlano({ ...formPlano, calorias: e.target.value ? Number(e.target.value) : '' })}
            />
          </label>
          <label>
            Proteína (g/dia)
            <input
              type="number"
              value={formPlano.proteina_g}
              onChange={(e) =>
                setFormPlano({ ...formPlano, proteina_g: e.target.value ? Number(e.target.value) : '' })
              }
            />
          </label>
          <label>
            Água (ml/dia)
            <input
              type="number"
              value={formPlano.agua_ml}
              onChange={(e) => setFormPlano({ ...formPlano, agua_ml: e.target.value ? Number(e.target.value) : '' })}
            />
          </label>
          <label>
            Sono (horas/dia)
            <input
              type="number"
              step="0.5"
              value={formPlano.sono_horas}
              onChange={(e) =>
                setFormPlano({ ...formPlano, sono_horas: e.target.value ? Number(e.target.value) : '' })
              }
            />
          </label>
          <div className="botoes-linha">
            <button type="submit">Salvar plano</button>
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

      <section>
        <h3>Hidratação</h3>
        <form className="inline-form" onSubmit={handleAddHidratacao}>
          <input type="number" value={mlHoje} onChange={(e) => setMlHoje(Number(e.target.value))} /> ml
          <button type="submit">Registrar</button>
        </form>
        <ul className="list-compact">
          {hidratacao.slice(0, 5).map((r) => (
            <li key={r.id}>
              {formatDataBR(r.data)} — {r.ml_consumido}ml
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Sono</h3>
        <form className="inline-form" onSubmit={handleAddSono}>
          <input
            type="number"
            step="0.5"
            value={horasSono}
            onChange={(e) => setHorasSono(Number(e.target.value))}
          />{' '}
          horas, qualidade
          <select value={qualidadeSono} onChange={(e) => setQualidadeSono(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button type="submit">Registrar</button>
        </form>
        <ul className="list-compact">
          {sono.slice(0, 5).map((r) => (
            <li key={r.id}>
              {formatDataBR(r.data)} — {r.horas}h (qualidade {r.qualidade})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Nutrição</h3>
        <form className="inline-form" onSubmit={handleAddNutricao}>
          <input
            type="number"
            placeholder="calorias"
            value={calorias}
            onChange={(e) => setCalorias(e.target.value ? Number(e.target.value) : '')}
          />
          <input
            type="number"
            placeholder="proteína (g)"
            value={proteina}
            onChange={(e) => setProteina(e.target.value ? Number(e.target.value) : '')}
          />
          <button type="submit">Registrar</button>
        </form>
        <ul className="list-compact">
          {nutricao.slice(0, 5).map((r) => (
            <li key={r.id}>
              {formatDataBR(r.data)} — {r.calorias}kcal, {r.proteina_g ?? '—'}g proteína
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
