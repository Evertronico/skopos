import { useEffect, useState } from 'react'
import {
  addExercicioAoPlano,
  atualizarExecucao,
  createPlano,
  deleteExercicioDoPlano,
  deletePlano,
  iniciarRegistroTreino,
  listExecucoes,
  listExerciciosDoPlano,
  listPlanos,
} from '../../db/repoTreino'
import type { ExecucaoExercicio, ExercicioPlano, PlanoTreino } from '../../db/types'
import { todayISO } from '../../lib/date'

const EXERCICIO_VAZIO = { nome: '', series: 3, repeticoes: 10, carga_kg: 0, descanso_seg: 60 }

export function TreinoPage() {
  const [planos, setPlanos] = useState<PlanoTreino[]>([])
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<number | null>(null)
  const [exercicios, setExercicios] = useState<ExercicioPlano[]>([])
  const [novoPlanoNome, setNovoPlanoNome] = useState('')
  const [novoExercicio, setNovoExercicio] = useState(EXERCICIO_VAZIO)
  const [registroAtivoId, setRegistroAtivoId] = useState<number | null>(null)
  const [execucoes, setExecucoes] = useState<ExecucaoExercicio[]>([])

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
      setExercicios([])
      return
    }
    listExerciciosDoPlano(planoSelecionadoId).then(setExercicios)
    setRegistroAtivoId(null)
    setExecucoes([])
  }, [planoSelecionadoId])

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

  async function handleAdicionarExercicio(e: React.FormEvent) {
    e.preventDefault()
    if (planoSelecionadoId === null || !novoExercicio.nome.trim()) return
    await addExercicioAoPlano({ ...novoExercicio, plano_id: planoSelecionadoId, ordem: exercicios.length })
    setNovoExercicio(EXERCICIO_VAZIO)
    setExercicios(await listExerciciosDoPlano(planoSelecionadoId))
  }

  async function handleExcluirExercicio(id: number) {
    await deleteExercicioDoPlano(id)
    if (planoSelecionadoId !== null) setExercicios(await listExerciciosDoPlano(planoSelecionadoId))
  }

  async function handleIniciarTreino() {
    if (planoSelecionadoId === null) return
    const registroId = await iniciarRegistroTreino(planoSelecionadoId, todayISO())
    setRegistroAtivoId(registroId)
    setExecucoes(await listExecucoes(registroId))
  }

  async function handleAtualizarExecucao(id: number, campos: Partial<ExecucaoExercicio>) {
    await atualizarExecucao(id, campos)
    if (registroAtivoId !== null) setExecucoes(await listExecucoes(registroAtivoId))
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
          placeholder="Nome do novo plano (ex: Treino A)"
          value={novoPlanoNome}
          onChange={(e) => setNovoPlanoNome(e.target.value)}
        />
        <button type="submit">Criar plano</button>
      </form>

      {planoSelecionadoId !== null && (
        <>
          <div className="section-header">
            <h3>Exercícios do plano</h3>
            <button className="link-danger" onClick={() => handleExcluirPlano(planoSelecionadoId)}>
              excluir plano
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
                onChange={(e) => setNovoExercicio({ ...novoExercicio, descanso_seg: Number(e.target.value) })}
              />
            </label>
            <button type="submit">Adicionar exercício</button>
          </form>

          {exercicios.length > 0 && registroAtivoId === null && (
            <button onClick={handleIniciarTreino}>Registrar treino de hoje</button>
          )}

          {registroAtivoId !== null && (
            <div className="execucao">
              <h3>Treino de hoje</h3>
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
                        onChange={(e) => handleAtualizarExecucao(exec.id, { carga_kg: Number(e.target.value) })}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
