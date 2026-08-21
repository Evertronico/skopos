import { useEffect, useState } from 'react'
import { DateNavigator } from '../../components/DateNavigator'
import { FloatingInput } from '../../components/FloatingInput'
import { IconCalendar, IconCheck, IconDumbbell, IconEdit, IconTrash } from '../../components/icons'
import { registrarLog } from '../../db/repoLogs'
import {
  addDiaAoPlano,
  addExercicioAoDia,
  adicionarExecucaoAvulsa,
  atualizarExecucao,
  buscarRegistroTreino,
  createPlano,
  deleteDiaDoPlano,
  deleteExecucao,
  deleteExercicioDoDia,
  deletePlano,
  deleteRegistroTreino,
  iniciarRegistroTreino,
  listDiasDoPlano,
  listExecucoes,
  listExerciciosDoDia,
  listPlanos,
  updateDiaDoPlano,
  updateExercicioDoDia,
  updatePlano,
} from '../../db/repoTreino'
import type { DiaPlano, DiaSemana, ExecucaoExercicio, ExercicioPlano, PlanoTreino } from '../../db/types'
import { diasEntre, formatDataBR, NOME_DIA_SEMANA, ORDEM_DIAS_SEMANA, todayISO } from '../../lib/date'
import { ExecucaoItem } from './ExecucaoItem'

type NumeroEditavel = number | ''

interface ExercicioForm {
  nome: string
  series: NumeroEditavel
  repeticoes: NumeroEditavel
  carga_kg: NumeroEditavel
  descanso_seg: NumeroEditavel
}

interface AvulsoForm {
  nome: string
  series_feitas: NumeroEditavel
  repeticoes_feitas: NumeroEditavel
  carga_kg: NumeroEditavel
  descanso_seg: NumeroEditavel
}

const EXERCICIO_VAZIO: ExercicioForm = { nome: '', series: 3, repeticoes: 10, carga_kg: 0, descanso_seg: 60 }
const AVULSO_VAZIO: AvulsoForm = {
  nome: '',
  series_feitas: 3,
  repeticoes_feitas: 10,
  carga_kg: 0,
  descanso_seg: 60,
}
const IDADE_LIMITE_FICHA_DIAS = 30

function numeroOuVazio(valorTexto: string): NumeroEditavel {
  return valorTexto === '' ? '' : Number(valorTexto)
}

function ouZero(valor: NumeroEditavel): number {
  return valor === '' ? 0 : valor
}

export function TreinoPage() {
  const [planos, setPlanos] = useState<PlanoTreino[]>([])
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<number | null>(null)
  const [mostrarFormFicha, setMostrarFormFicha] = useState(false)
  const [novoPlanoNome, setNovoPlanoNome] = useState('')
  const [editandoFicha, setEditandoFicha] = useState(false)
  const [nomeFichaEdit, setNomeFichaEdit] = useState('')

  const [dias, setDias] = useState<DiaPlano[]>([])
  const [diaSelecionadoId, setDiaSelecionadoId] = useState<number | null>(null)
  const [mostrarFormDia, setMostrarFormDia] = useState(false)
  const [editandoDiaId, setEditandoDiaId] = useState<number | null>(null)
  const [novoDiaSemana, setNovoDiaSemana] = useState<DiaSemana>(1)
  const [novoDiaNome, setNovoDiaNome] = useState('')

  const [exercicios, setExercicios] = useState<ExercicioPlano[]>([])
  const [mostrarFormExercicio, setMostrarFormExercicio] = useState(false)
  const [editandoExercicioId, setEditandoExercicioId] = useState<number | null>(null)
  const [novoExercicio, setNovoExercicio] = useState(EXERCICIO_VAZIO)

  const [dataRegistro, setDataRegistro] = useState(todayISO())
  const [registroAtivoId, setRegistroAtivoId] = useState<number | null>(null)
  const [execucoes, setExecucoes] = useState<ExecucaoExercicio[]>([])
  const [novoAvulso, setNovoAvulso] = useState(AVULSO_VAZIO)
  const [mostrarFormAvulso, setMostrarFormAvulso] = useState(false)

  const planoSelecionado = planos.find((p) => p.id === planoSelecionadoId) ?? null
  const diaSelecionado = dias.find((d) => d.id === diaSelecionadoId) ?? null
  const idadePlanoDias = planoSelecionado ? diasEntre(planoSelecionado.criado_em, todayISO()) : 0

  async function recarregarPlanos() {
    const lista = await listPlanos()
    setPlanos(lista)
    if (!planoSelecionadoId && lista.length > 0) setPlanoSelecionadoId(lista[0].id)
  }

  useEffect(() => {
    recarregarPlanos()
  }, [])

  useEffect(() => {
    if (planoSelecionadoId === null) {
      setDias([])
      setDiaSelecionadoId(null)
      return
    }
    listDiasDoPlano(planoSelecionadoId).then((lista) => {
      setDias(lista)
      setDiaSelecionadoId(lista[0]?.id ?? null)
    })
  }, [planoSelecionadoId])

  useEffect(() => {
    if (diaSelecionadoId === null) {
      setExercicios([])
      return
    }
    listExerciciosDoDia(diaSelecionadoId).then(setExercicios)
    setEditandoExercicioId(null)
    setNovoExercicio(EXERCICIO_VAZIO)
    setMostrarFormExercicio(false)
  }, [diaSelecionadoId])

  // Navegar a data (ou trocar de dia da ficha) carrega automaticamente o treino daquele dia, se existir.
  useEffect(() => {
    if (diaSelecionadoId === null) {
      setRegistroAtivoId(null)
      setExecucoes([])
      return
    }
    buscarRegistroTreino(diaSelecionadoId, dataRegistro).then((registro) => {
      if (registro) {
        setRegistroAtivoId(registro.id)
        listExecucoes(registro.id).then(setExecucoes)
      } else {
        setRegistroAtivoId(null)
        setExecucoes([])
      }
    })
  }, [diaSelecionadoId, dataRegistro])

  async function handleCriarPlano(e: React.FormEvent) {
    e.preventDefault()
    if (!novoPlanoNome.trim()) return
    const id = await createPlano(novoPlanoNome.trim())
    setNovoPlanoNome('')
    setMostrarFormFicha(false)
    await recarregarPlanos()
    setPlanoSelecionadoId(id)
  }

  async function handleSalvarNomeFicha(e: React.FormEvent) {
    e.preventDefault()
    if (planoSelecionadoId === null || !nomeFichaEdit.trim()) return
    await updatePlano(planoSelecionadoId, nomeFichaEdit.trim())
    setEditandoFicha(false)
    await recarregarPlanos()
  }

  async function handleExcluirPlano(id: number) {
    if (!confirm('Excluir esta ficha e todos os dias, exercícios e treinos registrados nela?')) return
    await deletePlano(id)
    setPlanoSelecionadoId(null)
    await recarregarPlanos()
  }

  async function handleSalvarDia(e: React.FormEvent) {
    e.preventDefault()
    if (planoSelecionadoId === null) return
    if (editandoDiaId !== null) {
      await updateDiaDoPlano(editandoDiaId, novoDiaSemana, novoDiaNome.trim() || null)
      setEditandoDiaId(null)
      setMostrarFormDia(false)
      const lista = await listDiasDoPlano(planoSelecionadoId)
      setDias(lista)
      setDiaSelecionadoId(editandoDiaId)
      return
    }
    const id = await addDiaAoPlano(planoSelecionadoId, novoDiaSemana, novoDiaNome.trim() || null)
    setNovoDiaNome('')
    setMostrarFormDia(false)
    const lista = await listDiasDoPlano(planoSelecionadoId)
    setDias(lista)
    setDiaSelecionadoId(id)
  }

  function iniciarEdicaoDia(dia: DiaPlano) {
    setEditandoDiaId(dia.id)
    setNovoDiaSemana(dia.dia_semana)
    setNovoDiaNome(dia.nome ?? '')
    setMostrarFormDia(true)
  }

  async function handleExcluirDia(id: number) {
    if (!confirm('Excluir este dia, seus exercícios previstos e os treinos já registrados nele?')) return
    await deleteDiaDoPlano(id)
    if (planoSelecionadoId === null) return
    const lista = await listDiasDoPlano(planoSelecionadoId)
    setDias(lista)
    setDiaSelecionadoId(lista[0]?.id ?? null)
  }

  async function handleSalvarExercicio(e: React.FormEvent) {
    e.preventDefault()
    if (diaSelecionadoId === null || !novoExercicio.nome.trim()) return
    if (editandoExercicioId !== null) {
      await updateExercicioDoDia(editandoExercicioId, {
        nome: novoExercicio.nome,
        series: ouZero(novoExercicio.series),
        repeticoes: ouZero(novoExercicio.repeticoes),
        carga_kg: ouZero(novoExercicio.carga_kg),
        descanso_seg: ouZero(novoExercicio.descanso_seg),
      })
    } else {
      await addExercicioAoDia({
        nome: novoExercicio.nome,
        series: ouZero(novoExercicio.series),
        repeticoes: ouZero(novoExercicio.repeticoes),
        carga_kg: ouZero(novoExercicio.carga_kg),
        descanso_seg: ouZero(novoExercicio.descanso_seg),
        dia_plano_id: diaSelecionadoId,
        ordem: exercicios.length,
      })
    }
    setNovoExercicio(EXERCICIO_VAZIO)
    setEditandoExercicioId(null)
    setMostrarFormExercicio(false)
    setExercicios(await listExerciciosDoDia(diaSelecionadoId))
  }

  function iniciarEdicaoExercicio(ex: ExercicioPlano) {
    setEditandoExercicioId(ex.id)
    setNovoExercicio({
      nome: ex.nome,
      series: ex.series ?? '',
      repeticoes: ex.repeticoes ?? '',
      carga_kg: ex.carga_kg ?? '',
      descanso_seg: ex.descanso_seg ?? '',
    })
    setMostrarFormExercicio(true)
  }

  async function handleExcluirExercicio(id: number) {
    await deleteExercicioDoDia(id)
    if (diaSelecionadoId !== null) setExercicios(await listExerciciosDoDia(diaSelecionadoId))
  }

  async function handleRegistrarTreinoDeHoje() {
    if (diaSelecionadoId === null) return
    const registroId = await iniciarRegistroTreino(diaSelecionadoId, dataRegistro)
    setRegistroAtivoId(registroId)
    setExecucoes(await listExecucoes(registroId))
  }

  async function handleAtualizarExecucao(id: number, campos: Partial<ExecucaoExercicio>) {
    await atualizarExecucao(id, campos)
    if (registroAtivoId !== null) setExecucoes(await listExecucoes(registroAtivoId))
  }

  async function handleAdicionarAvulso(e: React.FormEvent) {
    e.preventDefault()
    if (registroAtivoId === null || !novoAvulso.nome.trim()) return
    await adicionarExecucaoAvulsa(registroAtivoId, novoAvulso.nome.trim(), {
      series_feitas: ouZero(novoAvulso.series_feitas),
      repeticoes_feitas: ouZero(novoAvulso.repeticoes_feitas),
      carga_kg: ouZero(novoAvulso.carga_kg),
      descanso_seg: ouZero(novoAvulso.descanso_seg),
    })
    setNovoAvulso(AVULSO_VAZIO)
    setMostrarFormAvulso(false)
    setExecucoes(await listExecucoes(registroAtivoId))
  }

  async function handleExcluirExecucao(id: number) {
    await deleteExecucao(id)
    if (registroAtivoId !== null) setExecucoes(await listExecucoes(registroAtivoId))
  }

  async function handleConcluirTreino() {
    if (registroAtivoId === null) return
    await registrarLog('fim_treino', registroAtivoId)
  }

  async function handleExcluirRegistro(id: number) {
    if (!confirm('Excluir este treino registrado? Os exercícios previstos na ficha não são afetados.')) return
    await deleteRegistroTreino(id)
    setRegistroAtivoId(null)
    setExecucoes([])
  }

  return (
    <div className="page">
      <h2>Treino</h2>

      {planos.length === 0 && !mostrarFormFicha && (
        <div className="card">
          <p>Você ainda não tem nenhuma ficha de treino.</p>
          <p className="hint">
            Uma ficha organiza seus treinos por dia da semana — por exemplo, Segunda = Peito e Tríceps, Quarta =
            Costas e Bíceps. Comece dando um nome a ela.
          </p>
          <button className="btn-primary" onClick={() => setMostrarFormFicha(true)}>
            Criar minha primeira ficha
          </button>
        </div>
      )}

      {(planos.length > 0 || mostrarFormFicha) && (
        <>
          {planos.length > 0 && (
            <div className="planos-tabs">
              {planos.map((p) => (
                <button
                  key={p.id}
                  className={p.id === planoSelecionadoId ? 'tab active' : 'tab'}
                  onClick={() => setPlanoSelecionadoId(p.id)}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          )}

          {!mostrarFormFicha && <button onClick={() => setMostrarFormFicha(true)}>+ nova ficha</button>}

          {mostrarFormFicha && (
            <form className="inline-form" onSubmit={handleCriarPlano}>
              <input
                type="text"
                placeholder="Nome da ficha (ex: Ficha Agosto)"
                value={novoPlanoNome}
                onChange={(e) => setNovoPlanoNome(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary">
                Criar
              </button>
              <button type="button" onClick={() => setMostrarFormFicha(false)}>
                Cancelar
              </button>
            </form>
          )}

          {planoSelecionado && (
            <div className="card">
              <div className="section-header">
                {!editandoFicha && (
                  <>
                    <span className="hint">
                      {planoSelecionado.nome} · criada em {formatDataBR(planoSelecionado.criado_em)}
                    </span>
                    <div className="botoes-linha">
                      <button
                        className="icon-neutro"
                        onClick={() => {
                          setEditandoFicha(true)
                          setNomeFichaEdit(planoSelecionado.nome)
                        }}
                        aria-label="Editar nome da ficha"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        className="icon-danger"
                        onClick={() => handleExcluirPlano(planoSelecionado.id)}
                        aria-label="Excluir ficha"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {editandoFicha && (
                <form className="inline-form" onSubmit={handleSalvarNomeFicha}>
                  <input type="text" value={nomeFichaEdit} onChange={(e) => setNomeFichaEdit(e.target.value)} autoFocus />
                  <button type="submit" className="btn-primary">
                    Salvar
                  </button>
                  <button type="button" onClick={() => setEditandoFicha(false)}>
                    Cancelar
                  </button>
                </form>
              )}

              {idadePlanoDias >= IDADE_LIMITE_FICHA_DIAS && (
                <p className="hint aviso">
                  Esta ficha tem {idadePlanoDias} dias. Recomenda-se revisar os exercícios a cada{' '}
                  {IDADE_LIMITE_FICHA_DIAS} dias.
                </p>
              )}

              <h3 className="card-title">
                <IconCalendar size={18} /> 1. Dias de treino
              </h3>

              {dias.length === 0 && (
                <p className="hint">Nenhum dia adicionado ainda. Adicione o primeiro abaixo.</p>
              )}

              {dias.length > 0 && (
                <div className="planos-tabs">
                  {ORDEM_DIAS_SEMANA.filter((ds) => dias.some((d) => d.dia_semana === ds)).map((ds) => {
                    const dia = dias.find((d) => d.dia_semana === ds)!
                    return (
                      <button
                        key={dia.id}
                        className={dia.id === diaSelecionadoId ? 'tab active' : 'tab'}
                        onClick={() => setDiaSelecionadoId(dia.id)}
                      >
                        {NOME_DIA_SEMANA[ds]}
                        {dia.nome ? ` — ${dia.nome}` : ''}
                      </button>
                    )
                  })}
                </div>
              )}

              {diaSelecionado && !mostrarFormDia && (
                <button className="icon-neutro" onClick={() => iniciarEdicaoDia(diaSelecionado)} aria-label="Editar dia">
                  <IconEdit size={14} /> editar dia selecionado
                </button>
              )}

              {!mostrarFormDia && (
                <button
                  onClick={() => {
                    setEditandoDiaId(null)
                    setNovoDiaSemana(1)
                    setNovoDiaNome('')
                    setMostrarFormDia(true)
                  }}
                >
                  + adicionar dia
                </button>
              )}

              {mostrarFormDia && (
                <form className="inline-form" onSubmit={handleSalvarDia}>
                  <select
                    value={novoDiaSemana}
                    onChange={(e) => setNovoDiaSemana(Number(e.target.value) as DiaSemana)}
                  >
                    {ORDEM_DIAS_SEMANA.map((ds) => (
                      <option key={ds} value={ds}>
                        {NOME_DIA_SEMANA[ds]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nome do dia (ex: Peito e Tríceps)"
                    value={novoDiaNome}
                    onChange={(e) => setNovoDiaNome(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">
                    {editandoDiaId !== null ? 'Salvar' : 'Adicionar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormDia(false)
                      setEditandoDiaId(null)
                    }}
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>
          )}

          {diaSelecionado && (
            <div className="card">
              <div className="section-header">
                <h3 className="card-title">
                  <IconDumbbell size={18} /> 2. Exercícios — {NOME_DIA_SEMANA[diaSelecionado.dia_semana]}
                  {diaSelecionado.nome ? ` · ${diaSelecionado.nome}` : ''}
                </h3>
                <button className="icon-danger" onClick={() => handleExcluirDia(diaSelecionado.id)} aria-label="Excluir dia">
                  <IconTrash size={16} />
                </button>
              </div>

              {exercicios.length === 0 && (
                <p className="hint">Nenhum exercício previsto ainda. Adicione o primeiro abaixo.</p>
              )}

              {exercicios.length > 0 && (
                <ul className="list">
                  {exercicios.map((ex) => (
                    <li key={ex.id}>
                      <button className="list-item-conteudo" onClick={() => iniciarEdicaoExercicio(ex)}>
                        {ex.nome} — {ex.series}x{ex.repeticoes} @ {ex.carga_kg}kg, descanso {ex.descanso_seg}s
                      </button>
                      <button className="icon-danger" onClick={() => handleExcluirExercicio(ex.id)} aria-label="Excluir exercício">
                        <IconTrash size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!mostrarFormExercicio && (
                <button
                  onClick={() => {
                    setEditandoExercicioId(null)
                    setNovoExercicio(EXERCICIO_VAZIO)
                    setMostrarFormExercicio(true)
                  }}
                >
                  + adicionar exercício
                </button>
              )}

              {mostrarFormExercicio && (
                <form className="form-page" onSubmit={handleSalvarExercicio}>
                  <label>
                    Exercício
                    <input
                      type="text"
                      value={novoExercicio.nome}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, nome: e.target.value })}
                      autoFocus
                    />
                  </label>
                  <div className="campos-grid">
                    <FloatingInput
                      label="Séries"
                      type="number"
                      inputMode="numeric"
                      value={novoExercicio.series}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, series: numeroOuVazio(e.target.value) })}
                    />
                    <FloatingInput
                      label="Repetições"
                      type="number"
                      inputMode="numeric"
                      value={novoExercicio.repeticoes}
                      onChange={(e) =>
                        setNovoExercicio({ ...novoExercicio, repeticoes: numeroOuVazio(e.target.value) })
                      }
                    />
                    <FloatingInput
                      label="Carga (kg)"
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={novoExercicio.carga_kg}
                      onChange={(e) =>
                        setNovoExercicio({ ...novoExercicio, carga_kg: numeroOuVazio(e.target.value) })
                      }
                    />
                    <FloatingInput
                      label="Descanso (seg)"
                      type="number"
                      inputMode="numeric"
                      value={novoExercicio.descanso_seg}
                      onChange={(e) =>
                        setNovoExercicio({ ...novoExercicio, descanso_seg: numeroOuVazio(e.target.value) })
                      }
                    />
                  </div>
                  <div className="botoes-linha">
                    <button type="submit" className="btn-primary">
                      {editandoExercicioId !== null ? 'Salvar' : 'Adicionar'}
                    </button>
                    <button type="button" onClick={() => setMostrarFormExercicio(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {diaSelecionado && exercicios.length > 0 && (
            <div className="card">
              <h3 className="card-title">
                <IconCheck size={18} /> 3. Registrar treino
              </h3>

              <DateNavigator data={dataRegistro} onChange={setDataRegistro} />

              {registroAtivoId === null && (
                <>
                  <p className="hint">Nenhum treino registrado em {formatDataBR(dataRegistro)} ainda.</p>
                  <button className="btn-primary" onClick={handleRegistrarTreinoDeHoje}>
                    Registrar treino deste dia
                  </button>
                </>
              )}

              {registroAtivoId !== null && (
                <div className="execucao">
                  <div className="section-header">
                    <h4>Treino de {formatDataBR(dataRegistro)}</h4>
                    <button
                      className="icon-danger"
                      onClick={() => handleExcluirRegistro(registroAtivoId)}
                      aria-label="Excluir este registro"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>

                  <ul className="list">
                    {execucoes.map((exec) => (
                      <ExecucaoItem
                        key={exec.id}
                        exec={exec}
                        seriesPlanejadas={
                          exercicios.find((ex) => ex.id === exec.exercicio_plano_id)?.series ?? null
                        }
                        onAtualizar={handleAtualizarExecucao}
                        onExcluir={handleExcluirExecucao}
                      />
                    ))}
                  </ul>

                  {!mostrarFormAvulso && (
                    <button onClick={() => setMostrarFormAvulso(true)}>+ exercício extra (não previsto)</button>
                  )}

                  {mostrarFormAvulso && (
                    <form className="form-page" onSubmit={handleAdicionarAvulso}>
                      <label>
                        Exercício extra
                        <input
                          type="text"
                          value={novoAvulso.nome}
                          onChange={(e) => setNovoAvulso({ ...novoAvulso, nome: e.target.value })}
                          autoFocus
                        />
                      </label>
                      <div className="execucao-campos">
                        <FloatingInput
                          label="Séries"
                          type="number"
                          inputMode="numeric"
                          value={novoAvulso.series_feitas}
                          onChange={(e) =>
                            setNovoAvulso({ ...novoAvulso, series_feitas: numeroOuVazio(e.target.value) })
                          }
                        />
                        <FloatingInput
                          label="Repetições"
                          type="number"
                          inputMode="numeric"
                          value={novoAvulso.repeticoes_feitas}
                          onChange={(e) =>
                            setNovoAvulso({ ...novoAvulso, repeticoes_feitas: numeroOuVazio(e.target.value) })
                          }
                        />
                        <FloatingInput
                          label="Carga (kg)"
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          value={novoAvulso.carga_kg}
                          onChange={(e) =>
                            setNovoAvulso({ ...novoAvulso, carga_kg: numeroOuVazio(e.target.value) })
                          }
                        />
                      </div>
                      <div className="botoes-linha">
                        <button type="submit" className="btn-primary">
                          Adicionar
                        </button>
                        <button type="button" onClick={() => setMostrarFormAvulso(false)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <button onClick={handleConcluirTreino}>Concluir treino</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
