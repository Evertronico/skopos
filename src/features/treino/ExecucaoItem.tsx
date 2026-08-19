import { useEffect, useState } from 'react'
import { IconTimer } from '../../components/icons'
import type { ExecucaoExercicio } from '../../db/types'

type CamposEditaveis = Partial<
  Pick<ExecucaoExercicio, 'series_feitas' | 'repeticoes_feitas' | 'carga_kg' | 'descanso_seg' | 'concluido'>
>

interface Props {
  exec: ExecucaoExercicio
  onAtualizar: (id: number, campos: CamposEditaveis) => void
}

function TimerDescanso({ segundos }: { segundos: number }) {
  const [contagem, setContagem] = useState<number | null>(null)

  useEffect(() => {
    if (contagem === null || contagem <= 0) {
      if (contagem === 0) setContagem(null)
      return
    }
    const tick = setTimeout(() => setContagem((atual) => (atual ?? 1) - 1), 1000)
    return () => clearTimeout(tick)
  }, [contagem])

  if (contagem !== null) {
    return <span className="timer-contagem">{contagem}</span>
  }

  return (
    <button
      type="button"
      className="timer-botao"
      onClick={() => setContagem(segundos > 0 ? segundos : 60)}
      aria-label="Iniciar cronômetro de descanso"
    >
      <IconTimer size={16} />
      {segundos > 0 ? segundos : 60}s
    </button>
  )
}

function numeroOuNulo(valorTexto: string): number | null {
  return valorTexto === '' ? null : Number(valorTexto)
}

export function ExecucaoItem({ exec, onAtualizar }: Props) {
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
        <TimerDescanso segundos={exec.descanso_seg ?? 60} />
      </div>

      <div className="execucao-campos">
        <input
          type="number"
          inputMode="numeric"
          aria-label="séries feitas"
          value={exec.series_feitas ?? ''}
          onChange={(e) => onAtualizar(exec.id, { series_feitas: numeroOuNulo(e.target.value) })}
        />
        <input
          type="number"
          inputMode="numeric"
          aria-label="repetições feitas"
          value={exec.repeticoes_feitas ?? ''}
          onChange={(e) => onAtualizar(exec.id, { repeticoes_feitas: numeroOuNulo(e.target.value) })}
        />
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          aria-label="carga usada"
          value={exec.carga_kg ?? ''}
          onChange={(e) => onAtualizar(exec.id, { carga_kg: numeroOuNulo(e.target.value) })}
        />
      </div>
    </li>
  )
}
