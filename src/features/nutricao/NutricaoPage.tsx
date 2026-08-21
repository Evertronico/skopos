import { useEffect, useState } from 'react'
import { DateNavigator } from '../../components/DateNavigator'
import { FloatingInput } from '../../components/FloatingInput'
import { IconChevronDown, IconDroplet, IconMoon, IconTarget, IconTrash, IconUtensils } from '../../components/icons'
import { listMedidas } from '../../db/repoMedidas'
import { getPerfil } from '../../db/repoPerfil'
import { getPlanoNutricional, removerPlanoNutricional, salvarPlanoNutricional } from '../../db/repoPlanoNutricional'
import {
  addHidratacao,
  addNutricao,
  addSono,
  buscarUltimaRefeicaoPorDescricao,
  deleteHidratacao,
  deleteNutricao,
  deleteSono,
  listDescricoesRefeicoesSugeridas,
  listHidratacaoDoDia,
  listNutricaoDoDia,
  listSonoDoDia,
  updateHidratacao,
  updateNutricao,
  updateSono,
} from '../../db/repoRegistros'
import type { Perfil, RegistroHidratacao, RegistroNutricao, RegistroSono } from '../../db/types'
import { calcularMetas, derivarMacros, type MetasNutricionais } from '../../lib/calculations'
import { formatDataHoraBR, nowHHMM, todayISO } from '../../lib/date'

type PlanoEditavel = {
  calorias: number | ''
  proteina_g: number | ''
  carboidrato_g: number | ''
  gordura_g: number | ''
  agua_ml: number | ''
  sono_horas: number | ''
}
const PLANO_VAZIO: PlanoEditavel = {
  calorias: '',
  proteina_g: '',
  carboidrato_g: '',
  gordura_g: '',
  agua_ml: '',
  sono_horas: '',
}

type AguaForm = { hora: string; ml: number | '' }
type SonoForm = { hora: string; horas: number | ''; qualidade: number }
type RefeicaoForm = {
  hora: string
  descricao: string
  calorias: number | ''
  proteina_g: number | ''
  carboidrato_g: number | ''
  gordura_g: number | ''
}

function aguaVazia(): AguaForm {
  return { hora: nowHHMM(), ml: 250 }
}
function sonoVazio(): SonoForm {
  return { hora: nowHHMM(), horas: 8, qualidade: 3 }
}
function refeicaoVazia(): RefeicaoForm {
  return { hora: nowHHMM(), descricao: '', calorias: '', proteina_g: '', carboidrato_g: '', gordura_g: '' }
}

function percentual(valor: number, meta: number | null): number | null {
  if (!meta || meta <= 0) return null
  return Math.round((valor / meta) * 100)
}

export function NutricaoPage() {
  const [diaAtual, setDiaAtual] = useState(todayISO())

  const [metasCalculadas, setMetasCalculadas] = useState<MetasNutricionais | null>(null)
  const [planoManual, setPlanoManual] = useState<PlanoEditavel | null>(null)
  const [editandoPlano, setEditandoPlano] = useState(false)
  const [formPlano, setFormPlano] = useState<PlanoEditavel>(PLANO_VAZIO)
  const [sugestoesRefeicao, setSugestoesRefeicao] = useState<string[]>([])

  const [hidratacaoDia, setHidratacaoDia] = useState<RegistroHidratacao[]>([])
  const [sonoDia, setSonoDia] = useState<RegistroSono[]>([])
  const [nutricaoDia, setNutricaoDia] = useState<RegistroNutricao[]>([])

  const [mostrarHistoricoAgua, setMostrarHistoricoAgua] = useState(false)
  const [mostrarHistoricoSono, setMostrarHistoricoSono] = useState(false)
  const [mostrarHistoricoRefeicoes, setMostrarHistoricoRefeicoes] = useState(false)

  const [formAgua, setFormAgua] = useState<AguaForm>(aguaVazia())
  const [editandoAguaId, setEditandoAguaId] = useState<number | null>(null)

  const [formSono, setFormSono] = useState<SonoForm>(sonoVazio())
  const [editandoSonoId, setEditandoSonoId] = useState<number | null>(null)

  const [formRefeicao, setFormRefeicao] = useState<RefeicaoForm>(refeicaoVazia())
  const [editandoRefeicaoId, setEditandoRefeicaoId] = useState<number | null>(null)

  async function recarregarMetas() {
    const [perfil, medidas, plano, sugestoes] = await Promise.all([
      getPerfil(),
      listMedidas(),
      getPlanoNutricional(),
      listDescricoesRefeicoesSugeridas(),
    ])
    const pesoAtual = medidas.find((m) => m.peso_kg !== null)?.peso_kg ?? null
    if (perfil) setMetasCalculadas(calcularMetas(perfil as Perfil, pesoAtual))

    if (plano) {
      setPlanoManual({
        calorias: plano.calorias ?? '',
        proteina_g: plano.proteina_g ?? '',
        carboidrato_g: plano.carboidrato_g ?? '',
        gordura_g: plano.gordura_g ?? '',
        agua_ml: plano.agua_ml ?? '',
        sono_horas: plano.sono_horas ?? '',
      })
    } else {
      setPlanoManual(null)
    }
    setSugestoesRefeicao(sugestoes)
  }

  async function recarregarDia() {
    const [h, s, n] = await Promise.all([
      listHidratacaoDoDia(diaAtual),
      listSonoDoDia(diaAtual),
      listNutricaoDoDia(diaAtual),
    ])
    setHidratacaoDia(h)
    setSonoDia(s)
    setNutricaoDia(n)
  }

  useEffect(() => {
    recarregarMetas()
  }, [])

  useEffect(() => {
    recarregarDia()
    setEditandoAguaId(null)
    setFormAgua(aguaVazia())
    setEditandoSonoId(null)
    setFormSono(sonoVazio())
    setEditandoRefeicaoId(null)
    setFormRefeicao(refeicaoVazia())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaAtual])

  const metas: MetasNutricionais | null = planoManual
    ? {
        calorias: Number(planoManual.calorias) || 0,
        proteina_g: Number(planoManual.proteina_g) || 0,
        carboidrato_g: Number(planoManual.carboidrato_g) || derivarMacros(Number(planoManual.calorias) || 0).carboidrato_g,
        gordura_g: Number(planoManual.gordura_g) || derivarMacros(Number(planoManual.calorias) || 0).gordura_g,
        agua_ml: Number(planoManual.agua_ml) || 0,
        sono_horas: Number(planoManual.sono_horas) || 0,
      }
    : metasCalculadas

  function abrirEdicaoPlano() {
    setFormPlano(
      planoManual ?? {
        calorias: metasCalculadas?.calorias ?? '',
        proteina_g: metasCalculadas?.proteina_g ?? '',
        carboidrato_g: metasCalculadas?.carboidrato_g ?? '',
        gordura_g: metasCalculadas?.gordura_g ?? '',
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
      carboidrato_g: formPlano.carboidrato_g === '' ? null : Number(formPlano.carboidrato_g),
      gordura_g: formPlano.gordura_g === '' ? null : Number(formPlano.gordura_g),
      agua_ml: formPlano.agua_ml === '' ? null : Number(formPlano.agua_ml),
      sono_horas: formPlano.sono_horas === '' ? null : Number(formPlano.sono_horas),
    })
    setEditandoPlano(false)
    await recarregarMetas()
  }

  async function handleUsarCalculoAutomatico() {
    await removerPlanoNutricional()
    setEditandoPlano(false)
    await recarregarMetas()
  }

  // --- Hidratação ---
  async function handleSalvarAgua(e: React.FormEvent) {
    e.preventDefault()
    if (formAgua.ml === '') return
    if (editandoAguaId !== null) await updateHidratacao(editandoAguaId, diaAtual, formAgua.hora || null, formAgua.ml)
    else await addHidratacao(diaAtual, formAgua.hora || null, formAgua.ml)
    setEditandoAguaId(null)
    setFormAgua(aguaVazia())
    await recarregarDia()
  }

  function iniciarEdicaoAgua(r: RegistroHidratacao) {
    setEditandoAguaId(r.id)
    setFormAgua({ hora: r.hora ?? nowHHMM(), ml: r.ml_consumido })
    setMostrarHistoricoAgua(true)
  }

  async function handleExcluirAgua(id: number) {
    await deleteHidratacao(id)
    if (editandoAguaId === id) {
      setEditandoAguaId(null)
      setFormAgua(aguaVazia())
    }
    await recarregarDia()
  }

  // --- Sono ---
  async function handleSalvarSono(e: React.FormEvent) {
    e.preventDefault()
    if (formSono.horas === '') return
    if (editandoSonoId !== null) {
      await updateSono(editandoSonoId, diaAtual, formSono.hora || null, formSono.horas, formSono.qualidade)
    } else {
      await addSono(diaAtual, formSono.hora || null, formSono.horas, formSono.qualidade)
    }
    setEditandoSonoId(null)
    setFormSono(sonoVazio())
    await recarregarDia()
  }

  function iniciarEdicaoSono(r: RegistroSono) {
    setEditandoSonoId(r.id)
    setFormSono({ hora: r.hora ?? nowHHMM(), horas: r.horas, qualidade: r.qualidade ?? 3 })
    setMostrarHistoricoSono(true)
  }

  async function handleExcluirSono(id: number) {
    await deleteSono(id)
    if (editandoSonoId === id) {
      setEditandoSonoId(null)
      setFormSono(sonoVazio())
    }
    await recarregarDia()
  }

  // --- Refeições ---
  async function handleDescricaoChange(valor: string) {
    setFormRefeicao({ ...formRefeicao, descricao: valor })
    if (formRefeicao.calorias !== '' || formRefeicao.proteina_g !== '') return
    const anterior = await buscarUltimaRefeicaoPorDescricao(valor)
    if (anterior) {
      setFormRefeicao((atual) => ({
        ...atual,
        calorias: anterior.calorias ?? '',
        proteina_g: anterior.proteina_g ?? '',
        carboidrato_g: anterior.carboidrato_g ?? '',
        gordura_g: anterior.gordura_g ?? '',
      }))
    }
  }

  async function handleSalvarRefeicao(e: React.FormEvent) {
    e.preventDefault()
    if (formRefeicao.calorias === '' || !formRefeicao.descricao.trim()) return
    const dados = {
      data: diaAtual,
      hora: formRefeicao.hora || null,
      descricao: formRefeicao.descricao.trim(),
      calorias: Number(formRefeicao.calorias),
      proteina_g: formRefeicao.proteina_g === '' ? null : Number(formRefeicao.proteina_g),
      carboidrato_g: formRefeicao.carboidrato_g === '' ? null : Number(formRefeicao.carboidrato_g),
      gordura_g: formRefeicao.gordura_g === '' ? null : Number(formRefeicao.gordura_g),
    }
    if (editandoRefeicaoId !== null) await updateNutricao(editandoRefeicaoId, dados)
    else await addNutricao(dados)
    setEditandoRefeicaoId(null)
    setFormRefeicao(refeicaoVazia())
    await recarregarDia()
  }

  function iniciarEdicaoRefeicao(r: RegistroNutricao) {
    setEditandoRefeicaoId(r.id)
    setFormRefeicao({
      hora: r.hora ?? nowHHMM(),
      descricao: r.descricao ?? '',
      calorias: r.calorias ?? '',
      proteina_g: r.proteina_g ?? '',
      carboidrato_g: r.carboidrato_g ?? '',
      gordura_g: r.gordura_g ?? '',
    })
    setMostrarHistoricoRefeicoes(true)
  }

  async function handleExcluirRefeicao(id: number) {
    await deleteNutricao(id)
    if (editandoRefeicaoId === id) {
      setEditandoRefeicaoId(null)
      setFormRefeicao(refeicaoVazia())
    }
    await recarregarDia()
  }

  const mlDiaTotal = hidratacaoDia.reduce((soma, r) => soma + r.ml_consumido, 0)
  const caloriasDiaTotal = nutricaoDia.reduce((soma, r) => soma + (r.calorias ?? 0), 0)
  const proteinaDiaTotal = nutricaoDia.reduce((soma, r) => soma + (r.proteina_g ?? 0), 0)
  const sonoDiaTotal = sonoDia.reduce((soma, r) => soma + r.horas, 0)

  return (
    <div className="page">
      <h2>Nutrição</h2>

      <DateNavigator data={diaAtual} onChange={setDiaAtual} />

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
                {percentual(caloriasDiaTotal, metas.calorias) !== null && (
                  <span className="badge">{percentual(caloriasDiaTotal, metas.calorias)}%</span>
                )}
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.proteina_g}g</span>
                <span className="meta-rotulo">proteína/dia</span>
                {percentual(proteinaDiaTotal, metas.proteina_g) !== null && (
                  <span className="badge">{percentual(proteinaDiaTotal, metas.proteina_g)}%</span>
                )}
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.carboidrato_g}g</span>
                <span className="meta-rotulo">carboidratos/dia</span>
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.gordura_g}g</span>
                <span className="meta-rotulo">gordura/dia</span>
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.agua_ml}ml</span>
                <span className="meta-rotulo">água/dia</span>
                {percentual(mlDiaTotal, metas.agua_ml) !== null && (
                  <span className="badge">{percentual(mlDiaTotal, metas.agua_ml)}%</span>
                )}
              </div>
              <div className="meta-card">
                <span className="meta-valor">{metas.sono_horas}h</span>
                <span className="meta-rotulo">sono/dia</span>
                {sonoDiaTotal > 0 && <span className="badge">{sonoDiaTotal}h</span>}
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
                label="Carboidratos (g/dia)"
                type="number"
                inputMode="decimal"
                value={formPlano.carboidrato_g}
                onChange={(e) =>
                  setFormPlano({ ...formPlano, carboidrato_g: e.target.value ? Number(e.target.value) : '' })
                }
              />
              <FloatingInput
                label="Gordura (g/dia)"
                type="number"
                inputMode="decimal"
                value={formPlano.gordura_g}
                onChange={(e) =>
                  setFormPlano({ ...formPlano, gordura_g: e.target.value ? Number(e.target.value) : '' })
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
        <form className="inline-form" onSubmit={handleSalvarAgua}>
          <FloatingInput
            label="Hora"
            type="time"
            className="horario-campo"
            value={formAgua.hora}
            onChange={(e) => setFormAgua({ ...formAgua, hora: e.target.value })}
          />
          <FloatingInput
            label="ml"
            type="number"
            inputMode="numeric"
            value={formAgua.ml}
            onChange={(e) => setFormAgua({ ...formAgua, ml: e.target.value === '' ? '' : Number(e.target.value) })}
          />
          <button type="submit" className="btn-primary">
            {editandoAguaId !== null ? 'Salvar' : 'Registrar'}
          </button>
          {editandoAguaId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditandoAguaId(null)
                setFormAgua(aguaVazia())
              }}
            >
              Cancelar
            </button>
          )}
        </form>

        {hidratacaoDia.length > 0 && (
          <>
            <button
              type="button"
              className={mostrarHistoricoAgua ? 'acordeao-cabecalho aberto' : 'acordeao-cabecalho'}
              onClick={() => setMostrarHistoricoAgua(!mostrarHistoricoAgua)}
            >
              Registros do dia ({hidratacaoDia.length})
              <IconChevronDown size={16} />
            </button>
            {mostrarHistoricoAgua && (
              <ul className="list-compact">
                {hidratacaoDia.map((r) => (
                  <li key={r.id} className="registro-linha">
                    <button className="list-item-conteudo" onClick={() => iniciarEdicaoAgua(r)}>
                      {formatDataHoraBR(r.data, r.hora)} — {r.ml_consumido}ml
                    </button>
                    <button className="icon-danger" onClick={() => handleExcluirAgua(r.id)} aria-label="Excluir">
                      <IconTrash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconMoon size={18} /> Sono
        </h3>
        <form className="inline-form" onSubmit={handleSalvarSono}>
          <FloatingInput
            label="Hora"
            type="time"
            className="horario-campo"
            value={formSono.hora}
            onChange={(e) => setFormSono({ ...formSono, hora: e.target.value })}
          />
          <FloatingInput
            label="horas"
            type="number"
            inputMode="decimal"
            step="0.5"
            value={formSono.horas}
            onChange={(e) => setFormSono({ ...formSono, horas: e.target.value === '' ? '' : Number(e.target.value) })}
          />
          <select value={formSono.qualidade} onChange={(e) => setFormSono({ ...formSono, qualidade: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                qualidade {n}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            {editandoSonoId !== null ? 'Salvar' : 'Registrar'}
          </button>
          {editandoSonoId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditandoSonoId(null)
                setFormSono(sonoVazio())
              }}
            >
              Cancelar
            </button>
          )}
        </form>

        {sonoDia.length > 0 && (
          <>
            <button
              type="button"
              className={mostrarHistoricoSono ? 'acordeao-cabecalho aberto' : 'acordeao-cabecalho'}
              onClick={() => setMostrarHistoricoSono(!mostrarHistoricoSono)}
            >
              Registros do dia ({sonoDia.length})
              <IconChevronDown size={16} />
            </button>
            {mostrarHistoricoSono && (
              <ul className="list-compact">
                {sonoDia.map((r) => (
                  <li key={r.id} className="registro-linha">
                    <button className="list-item-conteudo" onClick={() => iniciarEdicaoSono(r)}>
                      {formatDataHoraBR(r.data, r.hora)} — {r.horas}h (qualidade {r.qualidade})
                    </button>
                    <button className="icon-danger" onClick={() => handleExcluirSono(r.id)} aria-label="Excluir">
                      <IconTrash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconUtensils size={18} /> Refeições
        </h3>
        <form className="form-page" onSubmit={handleSalvarRefeicao}>
          <FloatingInput
            label="Hora"
            type="time"
            className="horario-campo"
            value={formRefeicao.hora}
            onChange={(e) => setFormRefeicao({ ...formRefeicao, hora: e.target.value })}
          />

          <FloatingInput
            label="Descrição da refeição"
            type="text"
            list="refeicoes-sugeridas"
            value={formRefeicao.descricao}
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
              value={formRefeicao.calorias}
              onChange={(e) =>
                setFormRefeicao({ ...formRefeicao, calorias: e.target.value ? Number(e.target.value) : '' })
              }
            />
            <FloatingInput
              label="Proteína (g)"
              type="number"
              inputMode="decimal"
              value={formRefeicao.proteina_g}
              onChange={(e) =>
                setFormRefeicao({ ...formRefeicao, proteina_g: e.target.value ? Number(e.target.value) : '' })
              }
            />
            <FloatingInput
              label="Carboidratos (g)"
              type="number"
              inputMode="decimal"
              value={formRefeicao.carboidrato_g}
              onChange={(e) =>
                setFormRefeicao({ ...formRefeicao, carboidrato_g: e.target.value ? Number(e.target.value) : '' })
              }
            />
            <FloatingInput
              label="Gordura (g)"
              type="number"
              inputMode="decimal"
              value={formRefeicao.gordura_g}
              onChange={(e) =>
                setFormRefeicao({ ...formRefeicao, gordura_g: e.target.value ? Number(e.target.value) : '' })
              }
            />
          </div>

          <div className="botoes-linha">
            <button type="submit" className="btn-primary">
              {editandoRefeicaoId !== null ? 'Salvar' : 'Registrar refeição'}
            </button>
            {editandoRefeicaoId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditandoRefeicaoId(null)
                  setFormRefeicao(refeicaoVazia())
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {nutricaoDia.length > 0 && (
          <>
            <button
              type="button"
              className={mostrarHistoricoRefeicoes ? 'acordeao-cabecalho aberto' : 'acordeao-cabecalho'}
              onClick={() => setMostrarHistoricoRefeicoes(!mostrarHistoricoRefeicoes)}
            >
              Registros do dia ({nutricaoDia.length})
              <IconChevronDown size={16} />
            </button>
            {mostrarHistoricoRefeicoes && (
              <ul className="list-compact">
                {nutricaoDia.map((r) => (
                  <li key={r.id} className="registro-linha">
                    <button className="list-item-conteudo" onClick={() => iniciarEdicaoRefeicao(r)}>
                      {formatDataHoraBR(r.data, r.hora)} — {r.descricao ?? 'refeição'}: {r.calorias}kcal
                    </button>
                    <button className="icon-danger" onClick={() => handleExcluirRefeicao(r.id)} aria-label="Excluir">
                      <IconTrash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
