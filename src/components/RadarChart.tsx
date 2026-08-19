import { Chart as ChartJS, Filler, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from 'chart.js'
import { Radar } from 'react-chartjs-2'
import type { RadarScores } from '../lib/radar'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const LABELS = ['Treino', 'Hidratação', 'Sono', 'Nutrição', 'Medidas']

function toArray(s: RadarScores): number[] {
  return [s.treino, s.hidratacao, s.sono, s.nutricao, s.medidas]
}

interface Props {
  atual: RadarScores
  anterior?: RadarScores
}

export function RadarChart({ atual, anterior }: Props) {
  const datasets = [
    {
      label: 'Esta semana',
      data: toArray(atual),
      backgroundColor: 'rgba(59, 130, 246, 0.25)',
      borderColor: 'rgb(59, 130, 246)',
      pointBackgroundColor: 'rgb(59, 130, 246)',
    },
  ]

  if (anterior) {
    datasets.push({
      label: 'Semana anterior',
      data: toArray(anterior),
      backgroundColor: 'rgba(148, 163, 184, 0.15)',
      borderColor: 'rgb(148, 163, 184)',
      pointBackgroundColor: 'rgb(148, 163, 184)',
    })
  }

  return (
    <Radar
      data={{ labels: LABELS, datasets }}
      options={{
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, showLabelBackdrop: false } } },
        plugins: { legend: { position: 'bottom' } },
      }}
    />
  )
}
