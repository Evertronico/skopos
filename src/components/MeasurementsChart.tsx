import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { corCss } from '../lib/cssVar'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export interface ItemMedida {
  label: string
  atual: number
  meta: number | null
}

interface Props {
  itens: ItemMedida[]
}

export function MeasurementsChart({ itens }: Props) {
  if (itens.length === 0) {
    return <p className="hint">Registre ao menos uma medida pra ver a comparação com a meta aqui.</p>
  }

  const temMeta = itens.some((i) => i.meta !== null)

  return (
    <div style={{ height: Math.max(160, itens.length * 46) }}>
      <Bar
        data={{
          labels: itens.map((i) => i.label),
          datasets: [
            { label: 'Atual', data: itens.map((i) => i.atual), backgroundColor: corCss('--accent'), borderRadius: 3 },
            ...(temMeta
              ? [
                  {
                    label: 'Meta',
                    data: itens.map((i) => i.meta),
                    backgroundColor: corCss('--highlight'),
                    borderRadius: 3,
                  },
                ]
              : []),
          ],
        }}
        options={{
          indexAxis: 'y' as const,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: corCss('--text-muted') }, grid: { color: corCss('--border-subtle') } },
            y: { ticks: { color: corCss('--text-muted') }, grid: { display: false } },
          },
          plugins: {
            legend: { display: temMeta, position: 'bottom' as const, labels: { color: corCss('--text-muted') } },
          },
        }}
      />
    </div>
  )
}
