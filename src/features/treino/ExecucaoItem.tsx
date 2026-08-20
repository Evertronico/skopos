import { useEffect, useState } from 'react'
import { FloatingInput } from '../../components/FloatingInput'
import { IconTimer } from '../../components/icons'
import { registrarLog } from '../../db/repoLogs'
import type { ExecucaoExercicio } from '../../db/types'

type CamposEditaveis = Partial<
  Pick<ExecucaoExercicio, 'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg' | 'concluido'>
>

interface Props {
  exec: ExecucaoExercicio
  seriesPlanejadas: number | null
  onAtualizar: (id: number, campos: CamposEditaveis) => void
}

type Fase = 'idle' | 'contando' | 'mensagem' | 'concluido'

const MENSAGENS = [
  'BORA! 🔥',
  'VAMOS LÁ! 💪',
  'BORA CRESCER! 🚀',
  'MAIS UMA! ⚡',
  'VOCÊ CONSEGUE! 💥',
  'NÃO PARA AGORA! 🔥',
  'ISSO AÍ! 🎯',
  'FOCO TOTAL! 💪',
]

function mensagemAleatoria(): string {
  return MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)]
}

function numeroOuNulo(valorTexto: string): number | null {
  return valorTexto === '' ? null : Number(valorTexto)
}

export function ExecucaoItem({ exec, seriesPlanejadas, onAtualizar }: Props) {
  const [fase, setFase] = useState<Fase>('idle')
  const [contagem, setContagem] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [cronometroIniciado, setCronometroIniciado] = useState(false)

  const descansoSeg = exec.descanso_seg && exec.descanso_seg > 0 ? exec.descanso_seg : 60
  const alvoSeries = seriesPlanejadas && seriesPlanejadas > 0 ? seriesPlanejadas : 3

  // Tick da contagem regressiva, um por segundo.
  useEffect(() => {
    if (fase !== 'contando' || contagem === null || contagem <= 0) return
    const tick = setTimeout(() => setContagem((atual) => (atual ?? 1) - 1), 1000)
    return () => clearTimeout(tick)
  }, [fase, contagem])

  // Zerou: soma uma série. Se bateu o alvo, marca concluído; senão, só mostra o incentivo — não reinicia sozinho.
  useEffect(() => {
    if (fase !== 'contando' || contagem !== 0) return

    const novaSerie = (exec.series_feitas ?? 0) + 1
    onAtualizar(exec.id, { series_feitas: novaSerie })
    void registrarLog('fim_cronometro', exec.registro_treino_id, `${exec.nome} · série ${novaSerie}`)

    if (novaSerie >= alvoSeries) {
      onAtualizar(exec.id, { concluido: 1 })
      void registrarLog('exercicio_concluido', exec.registro_treino_id, `${exec.nome} · automático`)
      setMensagem('EXERCÍCIO CONCLUÍDO! 🏆')
      setFase('concluido')
    } else {
      setMensagem(mensagemAleatoria())
      setFase('mensagem')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, contagem])

  // A mensagem some sozinha e volta pro estado inicial — o próximo descanso só começa com um novo clique.
  useEffect(() => {
    if (fase !== 'mensagem' && fase !== 'concluido') return
    const t = setTimeout(() => {
      setFase('idle')
      setContagem(null)
    }, 1800)
    return () => clearTimeout(t)
  }, [fase])

  async function iniciar() {
    await registrarLog('inicio_atividade', exec.registro_treino_id, exec.nome)
    await registrarLog('inicio_cronometro', exec.registro_treino_id, exec.nome)
    // A ficha pré-preenche séries feitas com o valor planejado; a primeira vez que o cronômetro
    // roda pra este exercício, zera o contador pra ele subir 1 por vez até bater o alvo de verdade.
    if (!cronometroIniciado) {
      onAtualizar(exec.id, { series_feitas: 0 })
      setCronometroIniciado(true)
    }
    setContagem(descansoSeg)
    setFase('contando')
  }

  function cancelar() {
    setFase('idle')
    setContagem(null)
  }

  const jaConcluido = exec.concluido === 1

  return (
    <li className="execucao-item">
      {(fase === 'mensagem' || fase === 'concluido') && (
        <div className={fase === 'concluido' ? 'overlay-motivacional concluido' : 'overlay-motivacional'}>
          <span className="overlay-texto">{mensagem}</span>
        </div>
      )}

      <div className="execucao-topo">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={jaConcluido}
            onChange={(e) => onAtualizar(exec.id, { concluido: e.target.checked ? 1 : 0 })}
          />
          {exec.nome}
          {exec.exercicio_plano_id === null && <span className="badge">extra</span>}
        </label>

        {!jaConcluido && fase === 'idle' && (
          <button type="button" className="timer-botao" onClick={iniciar} aria-label="Iniciar descanso">
            <IconTimer size={16} />
            {descansoSeg}s
          </button>
        )}

        {fase === 'contando' && (
          <button type="button" className="timer-contagem" onClick={cancelar} aria-label="Cancelar descanso">
            <span className="timer-numero">{contagem}</span>
            <span className="timer-ciclo">
              série {(exec.series_feitas ?? 0) + 1}/{alvoSeries}
            </span>
          </button>
        )}
      </div>

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
