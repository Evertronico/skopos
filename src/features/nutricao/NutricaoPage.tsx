import { useEffect, useState } from 'react'
import { getPerfil } from '../../db/repoPerfil'
import { addHidratacao, addNutricao, addSono, listHidratacao, listNutricao, listSono } from '../../db/repoRegistros'
import type { Perfil, RegistroHidratacao, RegistroNutricao, RegistroSono } from '../../db/types'
import { calcularMetas, type MetasNutricionais } from '../../lib/calculations'
import { listMedidas } from '../../db/repoMedidas'
import { formatDataBR, todayISO } from '../../lib/date'

export function NutricaoPage() {
  const [metas, setMetas] = useState<MetasNutricionais | null>(null)
  const [hidratacao, setHidratacao] = useState<RegistroHidratacao[]>([])
  const [sono, setSono] = useState<RegistroSono[]>([])
  const [nutricao, setNutricao] = useState<RegistroNutricao[]>([])

  const [mlHoje, setMlHoje] = useState(250)
  const [horasSono, setHorasSono] = useState(8)
  const [qualidadeSono, setQualidadeSono] = useState(3)
  const [calorias, setCalorias] = useState<number | ''>('')
  const [proteina, setProteina] = useState<number | ''>('')

  async function recarregar() {
    const [perfil, medidas, h, s, n] = await Promise.all([
      getPerfil(),
      listMedidas(),
      listHidratacao(),
      listSono(),
      listNutricao(),
    ])
    const pesoAtual = medidas[0]?.peso_kg
    if (perfil && pesoAtual) setMetas(calcularMetas(perfil as Perfil, pesoAtual))
    setHidratacao(h)
    setSono(s)
    setNutricao(n)
  }

  useEffect(() => {
    recarregar()
  }, [])

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

  return (
    <div className="page">
      <h2>Nutrição, hidratação e sono</h2>

      {!metas && (
        <p className="hint">
          Preencha o perfil e registre ao menos uma medida de peso para calcular suas metas.
        </p>
      )}

      {metas && (
        <div className="metas-grid">
          <div className="meta-card">
            <span className="meta-valor">{metas.calorias}</span>
            <span className="meta-rotulo">kcal/dia</span>
          </div>
          <div className="meta-card">
            <span className="meta-valor">{metas.proteina_g}g</span>
            <span className="meta-rotulo">proteína/dia</span>
          </div>
          <div className="meta-card">
            <span className="meta-valor">{metas.agua_ml}ml</span>
            <span className="meta-rotulo">água/dia</span>
          </div>
          <div className="meta-card">
            <span className="meta-valor">{metas.sono_horas}h</span>
            <span className="meta-rotulo">sono/dia</span>
          </div>
        </div>
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
