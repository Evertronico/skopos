import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { formatDataBR } from '../lib/date'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

interface Props {
  pontos: { data: string; peso_kg: number | null }[]
}

export function WeightChart({ pontos }: Props) {
  const ordenados = [...pontos].filter((p) => p.peso_kg !== null).reverse()

  if (ordenados.length < 2) {
    return <p className="hint">Registre ao menos duas medidas com peso para ver o gráfico de evolução.</p>
  }

  return (
    <Line
      data={{
        labels: ordenados.map((p) => formatDataBR(p.data)),
        datasets: [
          {
            label: 'Peso (kg)',
            data: ordenados.map((p) => p.peso_kg),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            tension: 0.25,
            fill: true,
          },
        ],
      }}
      options={{ plugins: { legend: { display: false } } }}
    />
  )
}
