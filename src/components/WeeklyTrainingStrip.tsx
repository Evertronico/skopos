import { useEffect, useState } from 'react'
import { listRegistrosTreinoEntre } from '../db/repoTreino'
import { adicionarDias, formatDataBR, paraISOLocal, todayISO } from '../lib/date'
import { IconChevronLeft, IconChevronRight } from './icons'

const DIAS_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function inicioDaSemanaISO(offsetSemanas: number): string {
  const hoje = new Date()
  const diaSemanaAtual = hoje.getDay()
  const diffParaSegunda = diaSemanaAtual === 0 ? -6 : 1 - diaSemanaAtual
  return adicionarDias(paraISOLocal(hoje), diffParaSegunda + offsetSemanas * 7)
}

export function WeeklyTrainingStrip() {
  const [offset, setOffset] = useState(0)
  const [contagens, setContagens] = useState<number[]>(Array(7).fill(0))

  const segunda = inicioDaSemanaISO(offset)
  const domingo = adicionarDias(segunda, 6)

  useEffect(() => {
    async function carregar() {
      const registros = await listRegistrosTreinoEntre(segunda, domingo)
      const porDia = Array(7).fill(0)
      for (const r of registros) {
        const d = new Date(`${r.data}T00:00:00`)
        const idx = (d.getDay() + 6) % 7
        porDia[idx] += 1
      }
      setContagens(porDia)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset])

  const hoje = todayISO()

  return (
    <div>
      <div className="semana-nav">
        <button type="button" onClick={() => setOffset(offset - 1)} aria-label="Semana anterior">
          <IconChevronLeft size={18} />
        </button>
        <span className="hint">
          {formatDataBR(segunda)} – {formatDataBR(domingo)}
        </span>
        <button
          type="button"
          onClick={() => setOffset(offset + 1)}
          disabled={offset >= 0}
          aria-label="Próxima semana"
        >
          <IconChevronRight size={18} />
        </button>
      </div>

      <div className="semana-strip">
        {DIAS_LABEL.map((label, i) => {
          const dataDoDia = adicionarDias(segunda, i)
          const contagem = contagens[i]
          const classes = ['semana-dia']
          if (contagem > 0) classes.push('com-treino')
          if (dataDoDia === hoje) classes.push('hoje')
          return (
            <div key={label} className={classes.join(' ')}>
              <div className="semana-dia-capsula">{contagem > 0 ? contagem : ''}</div>
              <span className="semana-dia-label">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
