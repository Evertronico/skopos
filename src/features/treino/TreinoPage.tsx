import { useEffect, useState } from 'react'
import {
  addDiaAoPlano,
  addExercicioAoDia,
  adicionarExecucaoAvulsa,
  atualizarExecucao,
  createPlano,
  deleteDiaDoPlano,
  deleteExercicioDoDia,
  deletePlano,
  deleteRegistroTreino,
  iniciarRegistroTreino,
  listDiasDoPlano,
  listExecucoes,
  listExerciciosDoDia,
  listHistoricoDoDia,
  listPlanos,
} from '../../db/repoTreino'
import type { DiaPlano, DiaSemana, ExecucaoExercicio, ExercicioPlano, PlanoTreino, RegistroTreino } from '../../db/types'
import { diasEntre, formatDataBR, NOME_DIA_SEMANA, ORDEM_DIAS_SEMANA, todayISO } from '../../lib/date'

const EXERCICIO_VAZIO = { nome: '', series: 3, repeticoes: 10, carga_kg: 0, descanso_seg: 60 }
const AVULSO_VAZIO = { nome: '', series_feitas: 3, repeticoes_feitas: 10, carga_kg: 0, descanso_seg: 60 }
const IDADE_LIMITE_FICHA_DIAS = 30

export function TreinoPage() {
  const [planos, setPlanos] = useState<PlanoTreino[]>([])
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<number | null>(null)
  const [mostrarFormFicha, setMostrarFormFicha] = useState(false)
  const [novoPlanoNome, setNovoPlanoNome] = useState('')

  const [dias, setDias] = useState<DiaPlano[]>([])
  const [diaSelecionadoId, setDiaSelecionadoId] = useState<number | null>(null)
  const [mostrarFormDia, setMostrarFormDia] = useState(false)
  const [novoDiaSemana, setNovoDiaSemana] = useState<DiaSemana>(1)
  const [novoDiaNome, setNovoDiaNome] = useState('')

  const [exercicios, setExercicios] = useState<ExercicioPlano[]>([])
  const [mostrarFormExercicio, setMostrarFormExercicio] = useState(false)
  const [novoExercicio, setNovoExercicio] = useState(EXERCICIO_VAZIO)

  const [historico, setHistorico] = useState<RegistroTreino[]>([])
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
      setHistorico([])
      setRegistroAtivoId(null)
      setExecucoes([])
      return
    }
    listExerciciosDoDia(diaSelecionadoId).then(setExercicios)
    listHistoricoDoDia(diaSelecionadoId).then(setHistorico)
    setRegistroAtivoId(null)
    setExecucoes([])
    setDataRegistro(todayISO())
  }, [diaSelecionadoId])

  async function handleCriarPlano(e: React.FormEvent) {
    e.preventDefault()
    if (!novoPlanoNome.trim()) return
    const id = await createPlano(novoPlanoNome.trim())
    setNovoPlanoNome('')
    setMostrarFormFicha(false)
    await recarregarPlanos()
    setPlanoSelecionadoId(id)
  }

  async function handleExcluirPlano(id: number) {
    if (!confirm('Excluir esta ficha e todos os dias, exercícios e treinos registrados nela?')) return
    await deletePlano(id)
    setPlanoSelecionadoId(null)
    await recarregarPlanos()
  }

  async function handleAdicionarDia(e: React.FormEvent) {
    e.preventDefault()
    if (planoSelecionadoId === null) return
    const id = await addDiaAoPlano(planoSelecionadoId, novoDiaSemana, novoDiaNome.trim() || null)
    setNovoDiaNome('')
    setMostrarFormDia(false)
    const lista = await listDiasDoPlano(planoSelecionadoId)
    setDias(lista)
    setDiaSelecionadoId(id)
  }

  async function handleExcluirDia(id: number) {
    if (!confirm('Excluir este dia, seus exercícios previstos e os treinos já registrados nele?')) return
    await deleteDiaDoPlano(id)
    if (planoSelecionadoId === null) return
    const lista = await listDiasDoPlano(planoSelecionadoId)
    setDias(lista)
    setDiaSelecionadoId(lista[0]?.id ?? null)
  }

  async function handleAdicionarExercicio(e: React.FormEvent) {
    e.preventDefault()
    if (diaSelecionadoId === null || !novoExercicio.nome.trim()) return
    await addExercicioAoDia({ ...novoExercicio, dia_plano_id: diaSelecionadoId, ordem: exercicios.length })
    setNovoExercicio(EXERCICIO_VAZIO)
    setMostrarFormExercicio(false)
    setExercicios(await listExerciciosDoDia(diaSelecionadoId))
  }

  async function handleExcluirExercicio(id: number) {
    await deleteExercicioDoDia(id)
    if (diaSelecionadoId !== null) setExercicios(await listExerciciosDoDia(diaSelecionadoId))
  }

  async function abrirRegistro(data: string) {
    if (diaSelecionadoId === null) return
    setDataRegistro(data)
    const registroId = await iniciarRegistroTreino(diaSelecionadoId, data)
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
      series_feitas: novoAvulso.series_feitas,
      repeticoes_feitas: novoAvulso.repeticoes_feitas,
      carga_kg: novoAvulso.carga_kg,
      descanso_seg: novoAvulso.descanso_seg,
    })
    setNovoAvulso(AVULSO_VAZIO)
    setMostrarFormAvulso(false)
    setExecucoes(await listExecucoes(registroAtivoId))
  }

  async function fecharRegistro() {
    setRegistroAtivoId(null)
    setExecucoes([])
    if (diaSelecionadoId !== null) setHistorico(await listHistoricoDoDia(diaSelecionadoId))
  }

  async function handleExcluirRegistro(id: number) {
    if (!confirm('Excluir este treino registrado? Os exercícios previstos na ficha não são afetados.')) return
    await deleteRegistroTreino(id)
    if (registroAtivoId === id) {
      setRegistroAtivoId(null)
      setExecucoes([])
    }
    if (diaSelecionadoId !== null) setHistorico(await listHistoricoDoDia(diaSelecionadoId))
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
          <button onClick={() => setMostrarFormFicha(true)}>Criar minha primeira ficha</button>
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
              <button type="submit">Criar</button>
              <button type="button" onClick={() => setMostrarFormFicha(false)}>
                Cancelar
              </button>
            </form>
          )}

          {planoSelecionado && (
            <div className="card">
              <div className="section-header">
                <span className="hint">Ficha criada em {formatDataBR(planoSelecionado.criado_em)}</span>
                <button className="link-danger" onClick={() => handleExcluirPlano(planoSelecionado.id)}>
                  excluir ficha
                </button>
              </div>

              {idadePlanoDias >= IDADE_LIMITE_FICHA_DIAS && (
                <p className="hint aviso">
                  Esta ficha tem {idadePlanoDias} dias. Recomenda-se revisar os exercícios a cada{' '}
                  {IDADE_LIMITE_FICHA_DIAS} dias.
                </p>
              )}

              <h3>1. Dias de treino</h3>

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

              {!mostrarFormDia && <button onClick={() => setMostrarFormDia(true)}>+ adicionar dia</button>}

              {mostrarFormDia && (
                <form className="inline-form" onSubmit={handleAdicionarDia}>
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
                  <button type="submit">Adicionar</button>
                  <button type="button" onClick={() => setMostrarFormDia(false)}>
                    Cancelar
                  </button>
                </form>
              )}
            </div>
          )}

          {diaSelecionado && (
            <div className="card">
              <div className="section-header">
                <h3>
                  2. Exercícios — {NOME_DIA_SEMANA[diaSelecionado.dia_semana]}
                  {diaSelecionado.nome ? ` · ${diaSelecionado.nome}` : ''}
                </h3>
                <button className="link-danger" onClick={() => handleExcluirDia(diaSelecionado.id)}>
                  excluir dia
                </button>
              </div>

              {exercicios.length === 0 && (
                <p className="hint">Nenhum exercício previsto ainda. Adicione o primeiro abaixo.</p>
              )}

              {exercicios.length > 0 && (
                <ul className="list">
                  {exercicios.map((ex) => (
                    <li key={ex.id}>
                      <span>
                        {ex.nome} — {ex.series}x{ex.repeticoes} @ {ex.carga_kg}kg, descanso {ex.descanso_seg}s
                      </span>
                      <button className="link-danger" onClick={() => handleExcluirExercicio(ex.id)}>
                        excluir
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!mostrarFormExercicio && (
                <button onClick={() => setMostrarFormExercicio(true)}>+ adicionar exercício</button>
              )}

              {mostrarFormExercicio && (
                <form className="form-page" onSubmit={handleAdicionarExercicio}>
                  <label>
                    Exercício
                    <input
                      type="text"
                      value={novoExercicio.nome}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, nome: e.target.value })}
                      autoFocus
                    />
                  </label>
                  <label>
                    Séries
                    <input
                      type="number"
                      value={novoExercicio.series}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, series: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Repetições
                    <input
                      type="number"
                      value={novoExercicio.repeticoes}
                      onChange={(e) =>
                        setNovoExercicio({ ...novoExercicio, repeticoes: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Carga (kg)
                    <input
                      type="number"
                      step="0.5"
                      value={novoExercicio.carga_kg}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, carga_kg: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Descanso (seg)
                    <input
                      type="number"
                      value={novoExercicio.descanso_seg}
                      onChange={(e) =>
                        setNovoExercicio({ ...novoExercicio, descanso_seg: Number(e.target.value) })
                      }
                    />
                  </label>
                  <div className="botoes-linha">
                    <button type="submit">Adicionar</button>
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
              <h3>3. Registrar treino</h3>

              {registroAtivoId === null && (
                <>
                  <div className="inline-form">
                    <label>
                      Data
                      <input
                        type="date"
                        value={dataRegistro}
                        onChange={(e) => setDataRegistro(e.target.value)}
                      />
                    </label>
                    <button onClick={() => abrirRegistro(dataRegistro)}>Registrar treino</button>
                  </div>

                  {historico.length > 0 && (
                    <>
                      <p className="hint">Treinos já registrados neste dia</p>
                      <ul className="list-compact">
                        {historico.map((h) => (
                          <li key={h.id} className="list-linha">
                            <button className="list-item-conteudo" onClick={() => abrirRegistro(h.data)}>
                              {formatDataBR(h.data)}
                            </button>
                            <button className="link-danger" onClick={() => handleExcluirRegistro(h.id)}>
                              excluir
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}

              {registroAtivoId !== null && (
                <div className="execucao">
                  <div className="section-header">
                    <h4>Treino de {formatDataBR(dataRegistro)}</h4>
                    <button className="link-danger" onClick={() => handleExcluirRegistro(registroAtivoId)}>
                      excluir este registro
                    </button>
                  </div>

                  <ul className="list">
                    {execucoes.map((exec) => (
                      <li key={exec.id} className="execucao-item">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={exec.concluido === 1}
                            onChange={(e) =>
                              handleAtualizarExecucao(exec.id, { concluido: e.target.checked ? 1 : 0 })
                            }
                          />
                          {exec.nome}
                          {exec.exercicio_plano_id === null && <span className="badge">extra</span>}
                        </label>
                        <div className="execucao-campos">
                          <input
                            type="number"
                            aria-label="séries feitas"
                            value={exec.series_feitas ?? ''}
                            onChange={(e) =>
                              handleAtualizarExecucao(exec.id, { series_feitas: Number(e.target.value) })
                            }
                          />
                          <input
                            type="number"
                            aria-label="repetições feitas"
                            value={exec.repeticoes_feitas ?? ''}
                            onChange={(e) =>
                              handleAtualizarExecucao(exec.id, { repeticoes_feitas: Number(e.target.value) })
                            }
                          />
                          <input
                            type="number"
                            step="0.5"
                            aria-label="carga usada"
                            value={exec.carga_kg ?? ''}
                            onChange={(e) =>
                              handleAtualizarExecucao(exec.id, { carga_kg: Number(e.target.value) })
                            }
                          />
                        </div>
                      </li>
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
                        <input
                          type="number"
                          aria-label="séries"
                          value={novoAvulso.series_feitas}
                          onChange={(e) =>
                            setNovoAvulso({ ...novoAvulso, series_feitas: Number(e.target.value) })
                          }
                        />
                        <input
                          type="number"
                          aria-label="repetições"
                          value={novoAvulso.repeticoes_feitas}
                          onChange={(e) =>
                            setNovoAvulso({ ...novoAvulso, repeticoes_feitas: Number(e.target.value) })
                          }
                        />
                        <input
                          type="number"
                          step="0.5"
                          aria-label="carga"
                          value={novoAvulso.carga_kg}
                          onChange={(e) => setNovoAvulso({ ...novoAvulso, carga_kg: Number(e.target.value) })}
                        />
                      </div>
                      <div className="botoes-linha">
                        <button type="submit">Adicionar</button>
                        <button type="button" onClick={() => setMostrarFormAvulso(false)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <button onClick={fecharRegistro}>Fechar</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
