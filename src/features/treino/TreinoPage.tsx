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
  iniciarRegistroTreino,
  listDiasDoPlano,
  listExecucoes,
  listExerciciosDoDia,
  listPlanos,
} from '../../db/repoTreino'
import type { DiaPlano, DiaSemana, ExecucaoExercicio, ExercicioPlano, PlanoTreino } from '../../db/types'
import { diasEntre, NOME_DIA_SEMANA, ORDEM_DIAS_SEMANA, todayISO } from '../../lib/date'

const EXERCICIO_VAZIO = { nome: '', series: 3, repeticoes: 10, carga_kg: 0, descanso_seg: 60 }
const AVULSO_VAZIO = { nome: '', series_feitas: 3, repeticoes_feitas: 10, carga_kg: 0, descanso_seg: 60 }
const IDADE_LIMITE_FICHA_DIAS = 30

export function TreinoPage() {
  const [planos, setPlanos] = useState<PlanoTreino[]>([])
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<number | null>(null)

  const [dias, setDias] = useState<DiaPlano[]>([])
  const [diaSelecionadoId, setDiaSelecionadoId] = useState<number | null>(null)
  const [novoDiaSemana, setNovoDiaSemana] = useState<DiaSemana>(1)
  const [novoDiaNome, setNovoDiaNome] = useState('')

  const [exercicios, setExercicios] = useState<ExercicioPlano[]>([])
  const [novoPlanoNome, setNovoPlanoNome] = useState('')
  const [novoExercicio, setNovoExercicio] = useState(EXERCICIO_VAZIO)

  const [dataRegistro, setDataRegistro] = useState(todayISO())
  const [registroAtivoId, setRegistroAtivoId] = useState<number | null>(null)
  const [execucoes, setExecucoes] = useState<ExecucaoExercicio[]>([])
  const [novoAvulso, setNovoAvulso] = useState(AVULSO_VAZIO)
  const [mostrarFormAvulso, setMostrarFormAvulso] = useState(false)

  const planoSelecionado = planos.find((p) => p.id === planoSelecionadoId) ?? null
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
      setRegistroAtivoId(null)
      setExecucoes([])
      return
    }
    listExerciciosDoDia(diaSelecionadoId).then(setExercicios)
    setRegistroAtivoId(null)
    setExecucoes([])
  }, [diaSelecionadoId])

  async function handleCriarPlano(e: React.FormEvent) {
    e.preventDefault()
    if (!novoPlanoNome.trim()) return
    const id = await createPlano(novoPlanoNome.trim())
    setNovoPlanoNome('')
    await recarregarPlanos()
    setPlanoSelecionadoId(id)
  }

  async function handleExcluirPlano(id: number) {
    await deletePlano(id)
    setPlanoSelecionadoId(null)
    await recarregarPlanos()
  }

  async function handleAdicionarDia(e: React.FormEvent) {
    e.preventDefault()
    if (planoSelecionadoId === null) return
    const id = await addDiaAoPlano(planoSelecionadoId, novoDiaSemana, novoDiaNome.trim() || null)
    setNovoDiaNome('')
    const lista = await listDiasDoPlano(planoSelecionadoId)
    setDias(lista)
    setDiaSelecionadoId(id)
  }

  async function handleExcluirDia(id: number) {
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
    setExercicios(await listExerciciosDoDia(diaSelecionadoId))
  }

  async function handleExcluirExercicio(id: number) {
    await deleteExercicioDoDia(id)
    if (diaSelecionadoId !== null) setExercicios(await listExerciciosDoDia(diaSelecionadoId))
  }

  async function handleIniciarTreino() {
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
      series_feitas: novoAvulso.series_feitas,
      repeticoes_feitas: novoAvulso.repeticoes_feitas,
      carga_kg: novoAvulso.carga_kg,
      descanso_seg: novoAvulso.descanso_seg,
    })
    setNovoAvulso(AVULSO_VAZIO)
    setMostrarFormAvulso(false)
    setExecucoes(await listExecucoes(registroAtivoId))
  }

  return (
    <div className="page">
      <h2>Treino</h2>

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

      <form className="inline-form" onSubmit={handleCriarPlano}>
        <input
          type="text"
          placeholder="Nome da nova ficha (ex: Ficha Agosto)"
          value={novoPlanoNome}
          onChange={(e) => setNovoPlanoNome(e.target.value)}
        />
        <button type="submit">Criar ficha</button>
      </form>

      {planoSelecionado && (
        <>
          <div className="section-header">
            <span className="hint">Ficha criada em {planoSelecionado.criado_em}</span>
            <button className="link-danger" onClick={() => handleExcluirPlano(planoSelecionado.id)}>
              excluir ficha
            </button>
          </div>

          {idadePlanoDias >= IDADE_LIMITE_FICHA_DIAS && (
            <p className="hint aviso">
              Esta ficha tem {idadePlanoDias} dias. Recomenda-se revisar e atualizar os exercícios a cada{' '}
              {IDADE_LIMITE_FICHA_DIAS} dias.
            </p>
          )}

          <h3>Dias da semana</h3>
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

          <form className="inline-form" onSubmit={handleAdicionarDia}>
            <select value={novoDiaSemana} onChange={(e) => setNovoDiaSemana(Number(e.target.value) as DiaSemana)}>
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
            <button type="submit">Adicionar dia à ficha</button>
          </form>

          {diaSelecionadoId !== null && (
            <>
              <div className="section-header">
                <h3>Exercícios do dia</h3>
                <button className="link-danger" onClick={() => handleExcluirDia(diaSelecionadoId)}>
                  excluir este dia
                </button>
              </div>

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

              <form className="form-page" onSubmit={handleAdicionarExercicio}>
                <label>
                  Exercício
                  <input
                    type="text"
                    value={novoExercicio.nome}
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, nome: e.target.value })}
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
                    onChange={(e) => setNovoExercicio({ ...novoExercicio, repeticoes: Number(e.target.value) })}
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
                <button type="submit">Adicionar exercício previsto</button>
              </form>

              {registroAtivoId === null && (
                <div className="inline-form">
                  <label>
                    Data do treino
                    <input
                      type="date"
                      value={dataRegistro}
                      onChange={(e) => setDataRegistro(e.target.value)}
                    />
                  </label>
                  <button onClick={handleIniciarTreino}>Registrar treino</button>
                </div>
              )}

              {registroAtivoId !== null && (
                <div className="execucao">
                  <h3>Treino de {dataRegistro}</h3>
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
                      <button type="submit">Adicionar</button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
