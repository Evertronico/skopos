import { useEffect, useState } from 'react'
import { FloatingInput } from '../../components/FloatingInput'
import { IconLoop, IconTimer } from '../../components/icons'
import { registrarLog } from '../../db/repoLogs'
import type { ExecucaoExercicio } from '../../db/types'

type CamposEditaveis = Partial<
  Pick<ExecucaoExercicio, 'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg' | 'concluido'>
>

interface Props {
  exec: ExecucaoExercicio
  onAtualizar: (id: number, campos: CamposEditaveis) => void
}

type Fase = 'idle' | 'contando' | 'mensagem' | 'concluido'

const MENSAGENS = [
  'Bora!',
  'Vamos lá!',
  'Bora crescer!',
  'Mais um!',
  'Você consegue!',
  'Não para agora!',
  'Isso aí!',
  'Foco total!',
]

function mensagemAleatoria(): string {
  return MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)]
}

function numeroOuNulo(valorTexto: string): number | null {
  return valorTexto === '' ? null : Number(valorTexto)
}

export function ExecucaoItem({ exec, onAtualizar }: Props) {
  const [fase, setFase] = useState<Fase>('idle')
  const [contagem, setContagem] = useState<number | null>(null)
  const [ciclo, setCiclo] = useState(0)
  const [mensagem, setMensagem] = useState('')

  const descansoSeg = exec.descanso_seg && exec.descanso_seg > 0 ? exec.descanso_seg : 60
  const alvoCiclos = Math.max(1, exec.repeticoes_feitas ?? 1)

  // Tick da contagem regressiva, um por segundo.
  useEffect(() => {
    if (fase !== 'contando' || contagem === null || contagem <= 0) return
    const tick = setTimeout(() => setContagem((atual) => (atual ?? 1) - 1), 1000)
    return () => clearTimeout(tick)
  }, [fase, contagem])

  // Zerou: fecha o ciclo. Se ainda não bateu o alvo, prepara a mensagem de incentivo pra reiniciar o loop.
  useEffect(() => {
    if (fase !== 'contando' || contagem !== 0) return

    const novoCiclo = ciclo + 1
    setCiclo(novoCiclo)
    void registrarLog('fim_cronometro', exec.registro_treino_id, `${exec.nome} · ciclo ${novoCiclo}`)

    if (novoCiclo >= alvoCiclos) {
      onAtualizar(exec.id, { concluido: 1 })
      void registrarLog('exercicio_concluido', exec.registro_treino_id, `${exec.nome} · automático`)
      setMensagem('Exercício concluído! 💪')
      setFase('concluido')
    } else {
      setMensagem(mensagemAleatoria())
      setFase('mensagem')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, contagem])

  // Mensagem de incentivo some sozinha e reinicia o loop; mensagem de conclusão some e volta ao estado inicial.
  useEffect(() => {
    if (fase === 'mensagem') {
      const t = setTimeout(() => {
        setContagem(descansoSeg)
        setFase('contando')
        void registrarLog('inicio_cronometro', exec.registro_treino_id, `${exec.nome} · ciclo ${ciclo + 1}`)
      }, 1600)
      return () => clearTimeout(t)
    }
    if (fase === 'concluido') {
      const t = setTimeout(() => {
        setFase('idle')
        setContagem(null)
      }, 2200)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase])

  async function iniciar() {
    await registrarLog('inicio_atividade', exec.registro_treino_id, exec.nome)
    await registrarLog('inicio_cronometro', exec.registro_treino_id, `${exec.nome} · ciclo 1`)
    setCiclo(0)
    setContagem(descansoSeg)
    setFase('contando')
  }

  function cancelar() {
    setFase('idle')
    setContagem(null)
    setCiclo(0)
  }

  return (
    <li className="execucao-item">
      <div className="execucao-topo">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={exec.concluido === 1}
            onChange={(e) => onAtualizar(exec.id, { concluido: e.target.checked ? 1 : 0 })}
          />
          {exec.nome}
          {exec.exercicio_plano_id === null && <span className="badge">extra</span>}
        </label>

        {fase === 'idle' && (
          <button type="button" className="timer-botao" onClick={iniciar} aria-label="Iniciar cronômetro">
            <IconTimer size={16} />
            {descansoSeg}s
          </button>
        )}

        {fase === 'contando' && (
          <button type="button" className="timer-contagem" onClick={cancelar} aria-label="Cancelar cronômetro">
            <span className="timer-numero">{contagem}</span>
            {alvoCiclos > 1 && (
              <span className="timer-ciclo">
                {ciclo + 1}/{alvoCiclos}
              </span>
            )}
          </button>
        )}

        {fase === 'mensagem' && <IconLoop size={20} className="timer-loop-icone" />}
      </div>

      {(fase === 'mensagem' || fase === 'concluido') && (
        <p className={fase === 'concluido' ? 'mensagem-motivacional concluido' : 'mensagem-motivacional'}>
          {mensagem}
        </p>
      )}

      <div className="execucao-campos">
        <FloatingInput
          label="Séries"
          type="number"
          inputMode="numeric"
          value={exec.series_feitas ?? ''}
          onChange={(e) => onAtualizar(exec.id, { series_feitas: numeroOuNulo(e.target.value) })}
        />
        <FloatingInput
          label="Repetições"
          type="number"
          inputMode="numeric"
          value={exec.repeticoes_feitas ?? ''}
          onChange={(e) => onAtualizar(exec.id, { repeticoes_feitas: numeroOuNulo(e.target.value) })}
        />
        <FloatingInput
          label="Carga (kg)"
          type="number"
          inputMode="decimal"
          step="0.5"
          value={exec.carga_kg ?? ''}
          onChange={(e) => onAtualizar(exec.id, { carga_kg: numeroOuNulo(e.target.value) })}
        />
      </div>
    </li>
  )
}
