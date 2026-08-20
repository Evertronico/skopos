import { useEffect, useState } from 'react'
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
  listHidratacao,
  listNutricao,
  listSono,
  updateHidratacao,
  updateNutricao,
  updateSono,
} from '../../db/repoRegistros'
import type { Perfil, RegistroHidratacao, RegistroNutricao, RegistroSono } from '../../db/types'
import { calcularMetas, derivarMacros, type MetasNutricionais } from '../../lib/calculations'
import { formatDataBR, todayISO } from '../../lib/date'

type PlanoEditavel = { calorias: number | ''; proteina_g: number | ''; agua_ml: number | ''; sono_horas: number | '' }
const PLANO_VAZIO: PlanoEditavel = { calorias: '', proteina_g: '', agua_ml: '', sono_horas: '' }

type RefeicaoForm = {
  descricao: string
  calorias: number | ''
  proteina_g: number | ''
  carboidrato_g: number | ''
  gordura_g: number | ''
}
const REFEICAO_VAZIA: RefeicaoForm = { descricao: '', calorias: '', proteina_g: '', carboidrato_g: '', gordura_g: '' }

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

  const [mostrarHistoricoAgua, setMostrarHistoricoAgua] = useState(false)
  const [mostrarHistoricoSono, setMostrarHistoricoSono] = useState(false)
  const [mostrarHistoricoRefeicoes, setMostrarHistoricoRefeicoes] = useState(false)

  const [dataAgua, setDataAgua] = useState(todayISO())
  const [mlHoje, setMlHoje] = useState<number | ''>(250)
  const [editandoAguaId, setEditandoAguaId] = useState<number | null>(null)

  const [dataSono, setDataSono] = useState(todayISO())
  const [horasSono, setHorasSono] = useState<number | ''>(8)
  const [qualidadeSono, setQualidadeSono] = useState(3)
  const [editandoSonoId, setEditandoSonoId] = useState<number | null>(null)

  const [dataRefeicao, setDataRefeicao] = useState(todayISO())
  const [refeicao, setRefeicao] = useState<RefeicaoForm>(REFEICAO_VAZIA)
  const [editandoRefeicaoId, setEditandoRefeicaoId] = useState<number | null>(null)

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
        ...derivarMacros(Number(planoManual.calorias) || 0),
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

  // --- Hidratação ---
  async function handleSalvarAgua(e: React.FormEvent) {
    e.preventDefault()
    if (mlHoje === '') return
    if (editandoAguaId !== null) await updateHidratacao(editandoAguaId, dataAgua, mlHoje)
    else await addHidratacao(dataAgua, mlHoje)
    setEditandoAguaId(null)
    setDataAgua(todayISO())
    setMlHoje(250)
    await recarregar()
  }

  function iniciarEdicaoAgua(r: RegistroHidratacao) {
    setEditandoAguaId(r.id)
    setDataAgua(r.data)
    setMlHoje(r.ml_consumido)
    setMostrarHistoricoAgua(true)
  }

  async function handleExcluirAgua(id: number) {
    await deleteHidratacao(id)
    if (editandoAguaId === id) {
      setEditandoAguaId(null)
      setDataAgua(todayISO())
      setMlHoje(250)
    }
    await recarregar()
  }

  // --- Sono ---
  async function handleSalvarSono(e: React.FormEvent) {
    e.preventDefault()
    if (horasSono === '') return
    if (editandoSonoId !== null) await updateSono(editandoSonoId, dataSono, horasSono, qualidadeSono)
    else await addSono(dataSono, horasSono, qualidadeSono)
    setEditandoSonoId(null)
    setDataSono(todayISO())
    setHorasSono(8)
    setQualidadeSono(3)
    await recarregar()
  }

  function iniciarEdicaoSono(r: RegistroSono) {
    setEditandoSonoId(r.id)
    setDataSono(r.data)
    setHorasSono(r.horas)
    setQualidadeSono(r.qualidade ?? 3)
    setMostrarHistoricoSono(true)
  }

  async function handleExcluirSono(id: number) {
    await deleteSono(id)
    if (editandoSonoId === id) {
      setEditandoSonoId(null)
      setDataSono(todayISO())
      setHorasSono(8)
    }
    await recarregar()
  }

  // --- Refeições ---
  async function handleDescricaoChange(valor: string) {
    setRefeicao({ ...refeicao, descricao: valor })
    if (refeicao.calorias !== '' || refeicao.proteina_g !== '') return
    const anterior = await buscarUltimaRefeicaoPorDescricao(valor)
    if (anterior) {
      setRefeicao((atual) => ({
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
    if (refeicao.calorias === '' || !refeicao.descricao.trim()) return
    const dados = {
      data: dataRefeicao,
      descricao: refeicao.descricao.trim(),
      calorias: Number(refeicao.calorias),
      proteina_g: refeicao.proteina_g === '' ? null : Number(refeicao.proteina_g),
      carboidrato_g: refeicao.carboidrato_g === '' ? null : Number(refeicao.carboidrato_g),
      gordura_g: refeicao.gordura_g === '' ? null : Number(refeicao.gordura_g),
    }
    if (editandoRefeicaoId !== null) await updateNutricao(editandoRefeicaoId, dados)
    else await addNutricao(dados)
    setEditandoRefeicaoId(null)
    setDataRefeicao(todayISO())
    setRefeicao(REFEICAO_VAZIA)
    await recarregar()
  }

  function iniciarEdicaoRefeicao(r: RegistroNutricao) {
    setEditandoRefeicaoId(r.id)
    setDataRefeicao(r.data)
    setRefeicao({
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
      setRefeicao(REFEICAO_VAZIA)
    }
    await recarregar()
  }

  const hoje = todayISO()
  const mlHojeTotal = hidratacao.filter((r) => r.data === hoje).reduce((soma, r) => soma + r.ml_consumido, 0)
  const caloriasHojeTotal = nutricao.filter((r) => r.data === hoje).reduce((soma, r) => soma + (r.calorias ?? 0), 0)
  const proteinaHojeTotal = nutricao.filter((r) => r.data === hoje).reduce((soma, r) => soma + (r.proteina_g ?? 0), 0)
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
        <form className="inline-form" onSubmit={handleSalvarAgua}>
          <input type="date" value={dataAgua} onChange={(e) => setDataAgua(e.target.value)} />
          <FloatingInput
            label="ml"
            type="number"
            inputMode="numeric"
            value={mlHoje}
            onChange={(e) => setMlHoje(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <button type="submit" className="btn-primary">
            {editandoAguaId !== null ? 'Salvar' : 'Registrar'}
          </button>
          {editandoAguaId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditandoAguaId(null)
                setDataAgua(todayISO())
                setMlHoje(250)
              }}
            >
              Cancelar
            </button>
          )}
        </form>

        {hidratacao.length > 0 && (
          <>
            <button
              type="button"
              className={mostrarHistoricoAgua ? 'acordeao-cabecalho aberto' : 'acordeao-cabecalho'}
              onClick={() => setMostrarHistoricoAgua(!mostrarHistoricoAgua)}
            >
              Histórico ({hidratacao.length})
              <IconChevronDown size={16} />
            </button>
            {mostrarHistoricoAgua && (
              <ul className="list-compact">
                {hidratacao.map((r) => (
                  <li key={r.id} className="registro-linha">
                    <button className="list-item-conteudo" onClick={() => iniciarEdicaoAgua(r)}>
                      {formatDataBR(r.data)} — {r.ml_consumido}ml
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
          <input type="date" value={dataSono} onChange={(e) => setDataSono(e.target.value)} />
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
            {editandoSonoId !== null ? 'Salvar' : 'Registrar'}
          </button>
          {editandoSonoId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditandoSonoId(null)
                setDataSono(todayISO())
                setHorasSono(8)
              }}
            >
              Cancelar
            </button>
          )}
        </form>

        {sono.length > 0 && (
          <>
            <button
              type="button"
              className={mostrarHistoricoSono ? 'acordeao-cabecalho aberto' : 'acordeao-cabecalho'}
              onClick={() => setMostrarHistoricoSono(!mostrarHistoricoSono)}
            >
              Histórico ({sono.length})
              <IconChevronDown size={16} />
            </button>
            {mostrarHistoricoSono && (
              <ul className="list-compact">
                {sono.map((r) => (
                  <li key={r.id} className="registro-linha">
                    <button className="list-item-conteudo" onClick={() => iniciarEdicaoSono(r)}>
                      {formatDataBR(r.data)} — {r.horas}h (qualidade {r.qualidade})
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
          <label>
            Data
            <input type="date" value={dataRefeicao} onChange={(e) => setDataRefeicao(e.target.value)} />
          </label>

          <FloatingInput
            label="Descrição da refeição"
            type="text"
            list="refeicoes-sugeridas"
            value={refeicao.descricao}
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
              value={refeicao.calorias}
              onChange={(e) => setRefeicao({ ...refeicao, calorias: e.target.value ? Number(e.target.value) : '' })}
            />
            <FloatingInput
              label="Proteína (g)"
              type="number"
              inputMode="decimal"
              value={refeicao.proteina_g}
              onChange={(e) =>
                setRefeicao({ ...refeicao, proteina_g: e.target.value ? Number(e.target.value) : '' })
              }
            />
            <FloatingInput
              label="Carboidratos (g)"
              type="number"
              inputMode="decimal"
              value={refeicao.carboidrato_g}
              onChange={(e) =>
                setRefeicao({ ...refeicao, carboidrato_g: e.target.value ? Number(e.target.value) : '' })
              }
            />
            <FloatingInput
              label="Gordura (g)"
              type="number"
              inputMode="decimal"
              value={refeicao.gordura_g}
              onChange={(e) => setRefeicao({ ...refeicao, gordura_g: e.target.value ? Number(e.target.value) : '' })}
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
                  setDataRefeicao(todayISO())
                  setRefeicao(REFEICAO_VAZIA)
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {nutricao.length > 0 && (
          <>
            <button
              type="button"
              className={mostrarHistoricoRefeicoes ? 'acordeao-cabecalho aberto' : 'acordeao-cabecalho'}
              onClick={() => setMostrarHistoricoRefeicoes(!mostrarHistoricoRefeicoes)}
            >
              Histórico ({nutricao.length})
              <IconChevronDown size={16} />
            </button>
            {mostrarHistoricoRefeicoes && (
              <ul className="list-compact">
                {nutricao.map((r) => (
                  <li key={r.id} className="registro-linha">
                    <button className="list-item-conteudo" onClick={() => iniciarEdicaoRefeicao(r)}>
                      {formatDataBR(r.data)} — {r.descricao ?? 'refeição'}: {r.calorias}kcal
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
