import { useEffect, useState } from 'react'
import type { ExecucaoExercicio } from '../../db/types'

type CamposEditaveis = Partial<
  Pick<ExecucaoExercicio, 'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg' | 'concluido'>
>

interface Props {
  exec: ExecucaoExercicio
  onAtualizar: (id: number, campos: CamposEditaveis) => void
}

const DURACAO_AVISO_MS = 5000

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ExecucaoItem({ exec, onAtualizar }: Props) {
  const [contagem, setContagem] = useState<number | null>(null)
  const [avisando, setAvisando] = useState(false)

  // Contagem regressiva: um tick por segundo enquanto houver tempo restante.
  useEffect(() => {
    if (contagem === null || contagem <= 0) return
    const tick = setTimeout(() => setContagem((atual) => (atual ?? 1) - 1), 1000)
    return () => clearTimeout(tick)
  }, [contagem])

  // Ao zerar, dispara o aviso. Efeito separado do de cima para não cancelar
  // o próprio timeout do aviso ao alterar `contagem` na mesma passada.
  useEffect(() => {
    if (contagem !== 0) return
    setContagem(null)
    setAvisando(true)
  }, [contagem])

  // Aviso some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!avisando) return
    const fimAviso = setTimeout(() => setAvisando(false), DURACAO_AVISO_MS)
    return () => clearTimeout(fimAviso)
  }, [avisando])

  function handleFezMaisUma() {
    onAtualizar(exec.id, { series_feitas: (exec.series_feitas ?? 0) + 1 })
    setAvisando(false)
    setContagem(exec.descanso_seg && exec.descanso_seg > 0 ? exec.descanso_seg : 60)
  }

  return (
    <li className="execucao-item">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={exec.concluido === 1}
          onChange={(e) => onAtualizar(exec.id, { concluido: e.target.checked ? 1 : 0 })}
        />
        {exec.nome}
        {exec.exercicio_plano_id === null && <span className="badge">extra</span>}
      </label>

      <div className="execucao-campos">
        <input
          type="number"
          aria-label="séries feitas"
          value={exec.series_feitas ?? ''}
          onChange={(e) => onAtualizar(exec.id, { series_feitas: Number(e.target.value) })}
        />
        <input
          type="number"
          aria-label="repetições feitas"
          value={exec.repeticoes_feitas ?? ''}
          onChange={(e) => onAtualizar(exec.id, { repeticoes_feitas: Number(e.target.value) })}
        />
        <input
          type="number"
          step="0.5"
          aria-label="carga usada"
          value={exec.carga_kg ?? ''}
          onChange={(e) => onAtualizar(exec.id, { carga_kg: Number(e.target.value) })}
        />
      </div>

      <div className="descanso-controle">
        {contagem === null && !avisando && (
          <button type="button" onClick={handleFezMaisUma}>
            Fiz mais uma série
          </button>
        )}

        {contagem !== null && (
          <div className="descanso-contagem">
            <span>Descansando: {formatarTempo(contagem)}</span>
            <button type="button" className="link" onClick={() => setContagem(null)}>
              pular
            </button>
          </div>
        )}

        {avisando && <div className="aviso-descanso">Hora da próxima série!</div>}
      </div>
    </li>
  )
}
