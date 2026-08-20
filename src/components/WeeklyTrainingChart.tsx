import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js'
import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { listRegistrosTreinoEntre } from '../db/repoTreino'
import { corCss } from '../lib/cssVar'
import { formatDataBR } from '../lib/date'
import { IconChevronLeft, IconChevronRight } from './icons'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const DIAS_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function inicioDaSemana(offsetSemanas: number): Date {
  const hoje = new Date()
  const diaSemanaAtual = hoje.getDay()
  const diffParaSegunda = diaSemanaAtual === 0 ? -6 : 1 - diaSemanaAtual
  const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  segunda.setDate(segunda.getDate() + diffParaSegunda + offsetSemanas * 7)
  return segunda
}

function paraISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function WeeklyTrainingChart() {
  const [offset, setOffset] = useState(0)
  const [contagens, setContagens] = useState<number[]>(Array(7).fill(0))

  const segunda = inicioDaSemana(offset)
  const domingo = new Date(segunda)
  domingo.setDate(segunda.getDate() + 6)

  useEffect(() => {
    async function carregar() {
      const registros = await listRegistrosTreinoEntre(paraISO(segunda), paraISO(domingo))
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

  return (
    <div>
      <div className="semana-nav">
        <button type="button" onClick={() => setOffset(offset - 1)} aria-label="Semana anterior">
          <IconChevronLeft size={18} />
        </button>
        <span className="hint">
          {formatDataBR(paraISO(segunda))} – {formatDataBR(paraISO(domingo))}
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
      <div style={{ height: 180 }}>
        <Bar
          data={{
            labels: DIAS_LABEL,
            datasets: [{ label: 'Treinos', data: contagens, backgroundColor: corCss('--accent'), borderRadius: 4 }],
          }}
          options={{
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: corCss('--text-muted') },
                grid: { color: corCss('--border-subtle') },
              },
              x: { ticks: { color: corCss('--text-muted') }, grid: { display: false } },
            },
            plugins: { legend: { display: false } },
          }}
        />
      </div>
    </div>
  )
}
