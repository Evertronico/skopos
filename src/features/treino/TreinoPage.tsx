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
  createPlano,
  deleteDiaDoPlano,
  deleteExecucao,
  deleteExercicioDoDia,
  deletePlano,
  deleteRegistroTreino,
  iniciarRegistroTreino,
  listExecucoes,
  listPlanos,
  listRegistrosTreinoPorData,
  listTodosDiasPlano,
  listTodosExerciciosPlano,
  ultimoTreinoPorGrupoMuscular,
  updateDiaDoPlano,
  updateExercicioDoDia,
  updatePlano,
} from '../../db/repoTreino'
import { GRUPOS_MUSCULARES } from '../../db/types'
import type { DiaPlano, DiaSemana, ExecucaoExercicio, ExercicioPlano, PlanoTreino, RegistroTreino } from '../../db/types'
import { diasEntre, formatDataBR, NOME_DIA_SEMANA, ORDEM_DIAS_SEMANA, todayISO } from '../../lib/date'
import { ExecucaoItem } from './ExecucaoItem'

type NumeroEditavel = number | ''

interface ExercicioForm {
  nome: string
  series: NumeroEditavel
  repeticoes: NumeroEditavel
  carga_kg: NumeroEditavel
  descanso_seg: NumeroEditavel
  grupo_muscular: string
}

interface AvulsoForm {
  nome: string
  series_feitas: NumeroEditavel
  repeticoes_feitas: NumeroEditavel
  carga_kg: NumeroEditavel
  descanso_seg: NumeroEditavel
}

const EXERCICIO_VAZIO: ExercicioForm = {
  nome: '',
  series: 3,
  repeticoes: 10,
  carga_kg: 0,
  descanso_seg: 60,
  grupo_muscular: '',
}
const AVULSO_VAZIO: AvulsoForm = { nome: '', series_feitas: 3, repeticoes_feitas: 10, carga_kg: 0, descanso_seg: 60 }
const IDADE_LIMITE_FICHA_DIAS = 30

function numeroOuVazio(valorTexto: string): NumeroEditavel {
  return valorTexto === '' ? '' : Number(valorTexto)
}

function ouZero(valor: NumeroEditavel): number {
  return valor === '' ? 0 : valor
}

function statusGrupoMuscular(diasDesde: number | null): { texto: string; tom: 'aviso' | 'neutro' | 'lembrete' } {
  if (diasDesde === null) return { texto: 'nunca treinado', tom: 'lembrete' }
  if (diasDesde <= 1) return { texto: `treinado há ${diasDesde === 0 ? 'hoje' : '1 dia'} — cuidado com sobrecarga`, tom: 'aviso' }
  if (diasDesde >= 6) return { texto: `${diasDesde} dias sem estímulo`, tom: 'lembrete' }
  return { texto: `há ${diasDesde} dias`, tom: 'neutro' }
}

export function TreinoPage() {
  const [planos, setPlanos] = useState<PlanoTreino[]>([])
  const [todosDias, setTodosDias] = useState<DiaPlano[]>([])
  const [todosExercicios, setTodosExercicios] = useState<ExercicioPlano[]>([])
  const [gruposUltimoTreino, setGruposUltimoTreino] = useState<Record<string, string>>({})

  // --- Treino do dia (primário) ---
  const [diaAtual, setDiaAtual] = useState(todayISO())
  const [registrosDoDia, setRegistrosDoDia] = useState<RegistroTreino[]>([])
  const [execucoesPorRegistro, setExecucoesPorRegistro] = useState<Record<number, ExecucaoExercicio[]>>({})
  const [mostrarAdicionarTreino, setMostrarAdicionarTreino] = useState(false)
  const [fichaParaAdicionar, setFichaParaAdicionar] = useState<number | null>(null)
  const [diaParaAdicionar, setDiaParaAdicionar] = useState<number | null>(null)
  const [avulsoRegistroId, setAvulsoRegistroId] = useState<number | null>(null)
  const [novoAvulso, setNovoAvulso] = useState(AVULSO_VAZIO)

  // --- Gerenciar fichas (secundário) ---
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<number | null>(null)
  const [mostrarFormFicha, setMostrarFormFicha] = useState(false)
  const [novoPlanoNome, setNovoPlanoNome] = useState('')
  const [editandoFicha, setEditandoFicha] = useState(false)
  const [nomeFichaEdit, setNomeFichaEdit] = useState('')

  const [diaGerenciadoId, setDiaGerenciadoId] = useState<number | null>(null)
  const [mostrarFormDia, setMostrarFormDia] = useState(false)
  const [editandoDiaId, setEditandoDiaId] = useState<number | null>(null)
  const [novoDiaSemana, setNovoDiaSemana] = useState<DiaSemana>(1)
  const [novoDiaNome, setNovoDiaNome] = useState('')

  const [mostrarFormExercicio, setMostrarFormExercicio] = useState(false)
  const [editandoExercicioId, setEditandoExercicioId] = useState<number | null>(null)
  const [novoExercicio, setNovoExercicio] = useState(EXERCICIO_VAZIO)

  const planoSelecionado = planos.find((p) => p.id === planoSelecionadoId) ?? null
  const diasDoPlanoSelecionado = todosDias.filter((d) => d.plano_id === planoSelecionadoId)
  const diaGerenciado = todosDias.find((d) => d.id === diaGerenciadoId) ?? null
  const exerciciosDoDiaGerenciado = todosExercicios.filter((e) => e.dia_plano_id === diaGerenciadoId)
  const idadePlanoDias = planoSelecionado ? diasEntre(planoSelecionado.criado_em, todayISO()) : 0

  async function carregarTudo() {
    const [listaPlanos, listaDias, listaExercicios, grupos] = await Promise.all([
      listPlanos(),
      listTodosDiasPlano(),
      listTodosExerciciosPlano(),
      ultimoTreinoPorGrupoMuscular(),
    ])
    setPlanos(listaPlanos)
    setTodosDias(listaDias)
    setTodosExercicios(listaExercicios)
    setGruposUltimoTreino(grupos)
    if (!planoSelecionadoId && listaPlanos.length > 0) setPlanoSelecionadoId(listaPlanos[0].id)
  }

  async function carregarDia() {
    const registros = await listRegistrosTreinoPorData(diaAtual)
    setRegistrosDoDia(registros)
    const pares = await Promise.all(registros.map(async (r) => [r.id, await listExecucoes(r.id)] as const))
    setExecucoesPorRegistro(Object.fromEntries(pares))
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  useEffect(() => {
    carregarDia()
    setMostrarAdicionarTreino(false)
    setAvulsoRegistroId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaAtual])

  useEffect(() => {
    setDiaGerenciadoId(diasDoPlanoSelecionado[0]?.id ?? null)
    setEditandoExercicioId(null)
    setMostrarFormExercicio(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planoSelecionadoId])

  // --- Treino do dia: handlers ---
  const fichasDisponiveisParaAdicionar = planos.filter((p) =>
    todosDias.some((d) => d.plano_id === p.id && !registrosDoDia.some((r) => r.dia_plano_id === d.id)),
  )
  const diasDisponiveisParaAdicionar = todosDias.filter(
    (d) => d.plano_id === fichaParaAdicionar && !registrosDoDia.some((r) => r.dia_plano_id === d.id),
  )

  async function handleAdicionarTreinoDoDia(e: React.FormEvent) {
    e.preventDefault()
    if (diaParaAdicionar === null) return
    await iniciarRegistroTreino(diaParaAdicionar, diaAtual)
    setMostrarAdicionarTreino(false)
    setFichaParaAdicionar(null)
    setDiaParaAdicionar(null)
    await carregarDia()
    await carregarTudo()
  }

  async function handleAtualizarExecucao(id: number, campos: Partial<ExecucaoExercicio>) {
    await atualizarExecucao(id, campos)
    await carregarDia()
    await carregarTudo()
  }

  async function handleExcluirExecucao(id: number) {
    await deleteExecucao(id)
    await carregarDia()
  }

  async function handleExcluirRegistroDoDia(id: number) {
    if (!confirm('Excluir este treino registrado? Os exercícios previstos na ficha não são afetados.')) return
    await deleteRegistroTreino(id)
    await carregarDia()
  }

  async function handleConcluirTreino(registroId: number) {
    await registrarLog('fim_treino', registroId)
  }

  async function handleAdicionarAvulso(e: React.FormEvent) {
    e.preventDefault()
    if (avulsoRegistroId === null || !novoAvulso.nome.trim()) return
    await adicionarExecucaoAvulsa(avulsoRegistroId, novoAvulso.nome.trim(), {
      series_feitas: ouZero(novoAvulso.series_feitas),
      repeticoes_feitas: ouZero(novoAvulso.repeticoes_feitas),
      carga_kg: ouZero(novoAvulso.carga_kg),
      descanso_seg: ouZero(novoAvulso.descanso_seg),
    })
    setNovoAvulso(AVULSO_VAZIO)
    setAvulsoRegistroId(null)
    await carregarDia()
  }

  // --- Gerenciar fichas: handlers ---
  async function handleCriarPlano(e: React.FormEvent) {
    e.preventDefault()
    if (!novoPlanoNome.trim()) return
    const id = await createPlano(novoPlanoNome.trim())
    setNovoPlanoNome('')
    setMostrarFormFicha(false)
    await carregarTudo()
    setPlanoSelecionadoId(id)
  }

  async function handleSalvarNomeFicha(e: React.FormEvent) {
    e.preventDefault()
    if (planoSelecionadoId === null || !nomeFichaEdit.trim()) return
    await updatePlano(planoSelecionadoId, nomeFichaEdit.trim())
    setEditandoFicha(false)
    await carregarTudo()
  }

  async function handleExcluirPlano(id: number) {
    if (!confirm('Excluir esta ficha e todos os dias, exercícios e treinos registrados nela?')) return
    await deletePlano(id)
    setPlanoSelecionadoId(null)
    await carregarTudo()
    await carregarDia()
  }

  async function handleSalvarDia(e: React.FormEvent) {
    e.preventDefault()
    if (planoSelecionadoId === null) return
    if (editandoDiaId !== null) {
      await updateDiaDoPlano(editandoDiaId, novoDiaSemana, novoDiaNome.trim() || null)
      setEditandoDiaId(null)
      setMostrarFormDia(false)
      await carregarTudo()
      setDiaGerenciadoId(editandoDiaId)
      return
    }
    const id = await addDiaAoPlano(planoSelecionadoId, novoDiaSemana, novoDiaNome.trim() || null)
    setNovoDiaNome('')
    setMostrarFormDia(false)
    await carregarTudo()
    setDiaGerenciadoId(id)
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
    await carregarTudo()
    await carregarDia()
  }

  async function handleSalvarExercicio(e: React.FormEvent) {
    e.preventDefault()
    if (diaGerenciadoId === null || !novoExercicio.nome.trim()) return
    const dados = {
      nome: novoExercicio.nome,
      series: ouZero(novoExercicio.series),
      repeticoes: ouZero(novoExercicio.repeticoes),
      carga_kg: ouZero(novoExercicio.carga_kg),
      descanso_seg: ouZero(novoExercicio.descanso_seg),
      grupo_muscular: novoExercicio.grupo_muscular || null,
    }
    if (editandoExercicioId !== null) {
      await updateExercicioDoDia(editandoExercicioId, dados)
    } else {
      await addExercicioAoDia({ ...dados, dia_plano_id: diaGerenciadoId, ordem: exerciciosDoDiaGerenciado.length })
    }
    setNovoExercicio(EXERCICIO_VAZIO)
    setEditandoExercicioId(null)
    setMostrarFormExercicio(false)
    await carregarTudo()
  }

  function iniciarEdicaoExercicio(ex: ExercicioPlano) {
    setEditandoExercicioId(ex.id)
    setNovoExercicio({
      nome: ex.nome,
      series: ex.series ?? '',
      repeticoes: ex.repeticoes ?? '',
      carga_kg: ex.carga_kg ?? '',
      descanso_seg: ex.descanso_seg ?? '',
      grupo_muscular: ex.grupo_muscular ?? '',
    })
    setMostrarFormExercicio(true)
  }

  async function handleExcluirExercicio(id: number) {
    await deleteExercicioDoDia(id)
    await carregarTudo()
  }

  function nomeDaFicha(dia: DiaPlano | undefined): string {
    if (!dia) return ''
    return planos.find((p) => p.id === dia.plano_id)?.nome ?? ''
  }

  return (
    <div className="page">
      <h2>Treino</h2>

      <div className="card">
        <h3 className="card-title">
          <IconCheck size={18} /> Treino do dia
        </h3>
        <DateNavigator data={diaAtual} onChange={setDiaAtual} />

        {registrosDoDia.length === 0 && (
          <p className="hint">Nenhum treino registrado em {formatDataBR(diaAtual)}.</p>
        )}

        {registrosDoDia.map((registro) => {
          const dia = todosDias.find((d) => d.id === registro.dia_plano_id)
          const execucoes = execucoesPorRegistro[registro.id] ?? []
          return (
            <div key={registro.id} className="registro-treino-bloco">
              <div className="section-header">
                <h4>
                  {nomeDaFicha(dia)}
                  {dia ? ` · ${NOME_DIA_SEMANA[dia.dia_semana]}${dia.nome ? ' — ' + dia.nome : ''}` : ''}
                </h4>
                <button
                  className="icon-danger"
                  onClick={() => handleExcluirRegistroDoDia(registro.id)}
                  aria-label="Excluir este treino"
                >
                  <IconTrash size={16} />
                </button>
              </div>

              <ul className="list">
                {execucoes.map((exec) => (
                  <ExecucaoItem
                    key={exec.id}
                    exec={exec}
                    seriesPlanejadas={todosExercicios.find((ex) => ex.id === exec.exercicio_plano_id)?.series ?? null}
                    onAtualizar={handleAtualizarExecucao}
                    onExcluir={handleExcluirExecucao}
                  />
                ))}
              </ul>

              {avulsoRegistroId !== registro.id && (
                <button onClick={() => setAvulsoRegistroId(registro.id)}>+ exercício extra (não previsto)</button>
              )}

              {avulsoRegistroId === registro.id && (
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
                      onChange={(e) => setNovoAvulso({ ...novoAvulso, series_feitas: numeroOuVazio(e.target.value) })}
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
                      onChange={(e) => setNovoAvulso({ ...novoAvulso, carga_kg: numeroOuVazio(e.target.value) })}
                    />
                  </div>
                  <div className="botoes-linha">
                    <button type="submit" className="btn-primary">
                      Adicionar
                    </button>
                    <button type="button" onClick={() => setAvulsoRegistroId(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <button onClick={() => handleConcluirTreino(registro.id)}>Concluir treino</button>
            </div>
          )
        })}

        {!mostrarAdicionarTreino && fichasDisponiveisParaAdicionar.length > 0 && (
          <button className="btn-primary" onClick={() => setMostrarAdicionarTreino(true)}>
            + adicionar treino deste dia
          </button>
        )}

        {mostrarAdicionarTreino && (
          <form className="inline-form" onSubmit={handleAdicionarTreinoDoDia}>
            <select
              value={fichaParaAdicionar ?? ''}
              onChange={(e) => {
                setFichaParaAdicionar(e.target.value ? Number(e.target.value) : null)
                setDiaParaAdicionar(null)
              }}
            >
              <option value="">Ficha...</option>
              {fichasDisponiveisParaAdicionar.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <select value={diaParaAdicionar ?? ''} onChange={(e) => setDiaParaAdicionar(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Dia...</option>
              {diasDisponiveisParaAdicionar.map((d) => (
                <option key={d.id} value={d.id}>
                  {NOME_DIA_SEMANA[d.dia_semana]}
                  {d.nome ? ` — ${d.nome}` : ''}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary" disabled={diaParaAdicionar === null}>
              Adicionar
            </button>
            <button type="button" onClick={() => setMostrarAdicionarTreino(false)}>
              Cancelar
            </button>
          </form>
        )}
      </div>

      <h3>Gerenciar fichas</h3>

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
                <IconCalendar size={18} /> Dias de treino
              </h3>

              {diasDoPlanoSelecionado.length === 0 && (
                <p className="hint">Nenhum dia adicionado ainda. Adicione o primeiro abaixo.</p>
              )}

              {diasDoPlanoSelecionado.length > 0 && (
                <div className="planos-tabs">
                  {ORDEM_DIAS_SEMANA.filter((ds) => diasDoPlanoSelecionado.some((d) => d.dia_semana === ds)).map((ds) => {
                    const dia = diasDoPlanoSelecionado.find((d) => d.dia_semana === ds)!
                    return (
                      <button
                        key={dia.id}
                        className={dia.id === diaGerenciadoId ? 'tab active' : 'tab'}
                        onClick={() => setDiaGerenciadoId(dia.id)}
                      >
                        {NOME_DIA_SEMANA[ds]}
                        {dia.nome ? ` — ${dia.nome}` : ''}
                      </button>
                    )
                  })}
                </div>
              )}

              {diaGerenciado && !mostrarFormDia && (
                <button className="icon-neutro" onClick={() => iniciarEdicaoDia(diaGerenciado)} aria-label="Editar dia">
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

          {diaGerenciado && (
            <div className="card">
              <div className="section-header">
                <h3 className="card-title">
                  <IconDumbbell size={18} /> Exercícios — {NOME_DIA_SEMANA[diaGerenciado.dia_semana]}
                  {diaGerenciado.nome ? ` · ${diaGerenciado.nome}` : ''}
                </h3>
                <button className="icon-danger" onClick={() => handleExcluirDia(diaGerenciado.id)} aria-label="Excluir dia">
                  <IconTrash size={16} />
                </button>
              </div>

              {exerciciosDoDiaGerenciado.length === 0 && (
                <p className="hint">Nenhum exercício previsto ainda. Adicione o primeiro abaixo.</p>
              )}

              {exerciciosDoDiaGerenciado.length > 0 && (
                <ul className="list">
                  {exerciciosDoDiaGerenciado.map((ex) => {
                    const ultimaData = ex.grupo_muscular ? gruposUltimoTreino[ex.grupo_muscular] : undefined
                    const diasDesde = ultimaData ? diasEntre(ultimaData, todayISO()) : null
                    const status = ex.grupo_muscular ? statusGrupoMuscular(diasDesde) : null
                    return (
                      <li key={ex.id}>
                        <button className="list-item-conteudo" onClick={() => iniciarEdicaoExercicio(ex)}>
                          <span>
                            {ex.nome} — {ex.series}x{ex.repeticoes} @ {ex.carga_kg}kg, descanso {ex.descanso_seg}s
                          </span>
                          {ex.grupo_muscular && status && (
                            <span className={`badge badge-${status.tom}`}>
                              {ex.grupo_muscular} · {status.texto}
                            </span>
                          )}
                        </button>
                        <button className="icon-danger" onClick={() => handleExcluirExercicio(ex.id)} aria-label="Excluir exercício">
                          <IconTrash size={16} />
                        </button>
                      </li>
                    )
                  })}
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
                  <label>
                    Grupo muscular
                    <select
                      value={novoExercicio.grupo_muscular}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, grupo_muscular: e.target.value })}
                    >
                      <option value="">Selecione</option>
                      {GRUPOS_MUSCULARES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
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
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, repeticoes: numeroOuVazio(e.target.value) })}
                    />
                    <FloatingInput
                      label="Carga (kg)"
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={novoExercicio.carga_kg}
                      onChange={(e) => setNovoExercicio({ ...novoExercicio, carga_kg: numeroOuVazio(e.target.value) })}
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
        </>
      )}
    </div>
  )
}
