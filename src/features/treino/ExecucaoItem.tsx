import { useEffect, useState } from 'react'
import { FloatingInput } from '../../components/FloatingInput'
import { IconChevronDown, IconTimer, IconTrash } from '../../components/icons'
import { registrarLog } from '../../db/repoLogs'
import type { ExecucaoExercicio } from '../../db/types'

type CamposEditaveis = Partial<
  Pick<
    ExecucaoExercicio,
    'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg' | 'concluido' | 'iniciado_em' | 'concluido_em'
  >
>

interface Props {
  exec: ExecucaoExercicio
  seriesPlanejadas: number | null
  onAtualizar: (id: number, campos: CamposEditaveis) => void
  onExcluir?: (id: number) => void
}

type Fase = 'idle' | 'contando' | 'mensagem' | 'concluido'

const MENSAGENS = [
  'BORA! 🔥',
  'VAMOS COM TUDO! 💪',
  'BORA CRESCER! 🚀',
  'MAIS UMA! ⚡',
  'VOCÊ CONSEGUE! 💥',
  'NÃO PARA AGORA! 🔥',
  'ISSO AÍ, CAMPEÃO! 🏆',
  'FOCO TOTAL! 💪',
  'MANDA VER! 🚀',
  'SEM MOLEZA! 💥',
  'VAMOS QUE VAMOS! 🔥',
  'TÁ VOANDO! 🚀',
]

function mensagemAleatoria(): string {
  return MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)]
}

function numeroOuNulo(valorTexto: string): number | null {
  return valorTexto === '' ? null : Number(valorTexto)
}

function formatarMMSS(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const RAIO_ANEL = 17
const CIRCUNFERENCIA_ANEL = 2 * Math.PI * RAIO_ANEL

export function ExecucaoItem({ exec, seriesPlanejadas, onAtualizar, onExcluir }: Props) {
  const [fase, setFase] = useState<Fase>('idle')
  const [contagem, setContagem] = useState<number | null>(null)
  const [minimizado, setMinimizado] = useState(false)
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
      onAtualizar(exec.id, { concluido: 1, concluido_em: new Date().toISOString() })
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
      setMinimizado(false)
    }, 1800)
    return () => clearTimeout(t)
  }, [fase])

  async function iniciar() {
    await registrarLog('inicio_atividade', exec.registro_treino_id, exec.nome)
    await registrarLog('inicio_cronometro', exec.registro_treino_id, exec.nome)
    // A ficha pré-preenche séries feitas com o valor planejado; a primeira vez que o cronômetro
    // roda pra este exercício, zera o contador pra ele subir 1 por vez até bater o alvo de verdade.
    if (!cronometroIniciado) {
      onAtualizar(exec.id, { series_feitas: 0, iniciado_em: new Date().toISOString() })
      setCronometroIniciado(true)
    }
    setContagem(descansoSeg)
    setMinimizado(false)
    setFase('contando')
  }

  function cancelar() {
    setFase('idle')
    setContagem(null)
    setMinimizado(false)
  }

  const jaConcluido = exec.concluido === 1
  const progresso = contagem !== null ? contagem / descansoSeg : 0

  return (
    <li className="execucao-item">
      {fase === 'contando' && !minimizado && (
        <div className="overlay-motivacional">
          <button type="button" className="overlay-minimizar" onClick={() => setMinimizado(true)} aria-label="Minimizar cronômetro">
            <IconChevronDown size={22} />
          </button>
          <div className="overlay-timer-conteudo">
            <span className="overlay-texto-timer">{formatarMMSS(contagem ?? 0)}</span>
            <span className="overlay-subtexto">
              {exec.nome} · série {(exec.series_feitas ?? 0) + 1}/{alvoSeries}
            </span>
            <button type="button" className="link overlay-cancelar" onClick={cancelar}>
              cancelar
            </button>
          </div>
        </div>
      )}

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
            onChange={(e) =>
              onAtualizar(exec.id, {
                concluido: e.target.checked ? 1 : 0,
                concluido_em: e.target.checked ? new Date().toISOString() : null,
              })
            }
          />
          {exec.nome}
          {exec.exercicio_plano_id === null && <span className="badge">extra</span>}
        </label>

        <div className="execucao-topo-acoes">
          {!jaConcluido && fase === 'idle' && (
            <button type="button" className="timer-botao" onClick={iniciar} aria-label="Iniciar descanso">
              <IconTimer size={16} />
              {descansoSeg}s
            </button>
          )}

          {fase === 'contando' && minimizado && (
            <button type="button" className="timer-anel" onClick={() => setMinimizado(false)} aria-label="Expandir cronômetro">
              <svg viewBox="0 0 40 40" width="40" height="40">
                <circle cx="20" cy="20" r={RAIO_ANEL} className="timer-anel-fundo" strokeWidth="4" fill="none" />
                <circle
                  cx="20"
                  cy="20"
                  r={RAIO_ANEL}
                  className="timer-anel-progresso"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={CIRCUNFERENCIA_ANEL}
                  strokeDashoffset={CIRCUNFERENCIA_ANEL * (1 - progresso)}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                />
              </svg>
              <span className="timer-anel-texto">{formatarMMSS(contagem ?? 0)}</span>
            </button>
          )}

          {exec.exercicio_plano_id === null && onExcluir && (
            <button type="button" className="icon-danger" onClick={() => onExcluir(exec.id)} aria-label="Excluir">
              <IconTrash size={16} />
            </button>
          )}
        </div>
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
