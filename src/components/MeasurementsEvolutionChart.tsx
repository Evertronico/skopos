import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { MedidaAntropometrica } from '../db/types'
import { corCss } from '../lib/cssVar'
import { formatDataBR } from '../lib/date'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

const CAMPOS: { chave: Exclude<keyof MedidaAntropometrica, 'id' | 'data' | 'hora'>; label: string }[] = [
  { chave: 'peso_kg', label: 'Peso (kg)' },
  { chave: 'percentual_gordura', label: '% Gordura' },
  { chave: 'cintura_cm', label: 'Cintura (cm)' },
  { chave: 'quadril_cm', label: 'Quadril (cm)' },
  { chave: 'peito_cm', label: 'Peito (cm)' },
  { chave: 'braco_cm', label: 'Braço (cm)' },
  { chave: 'coxa_cm', label: 'Coxa (cm)' },
  { chave: 'pescoco_cm', label: 'Pescoço (cm)' },
]

interface Props {
  medidas: MedidaAntropometrica[]
}

export function MeasurementsEvolutionChart({ medidas }: Props) {
  const ordenadas = [...medidas].reverse()

  const graficos = CAMPOS.map(({ chave, label }) => ({
    label,
    pontos: ordenadas
      .filter((m) => m[chave] !== null)
      .map((m) => ({ data: m.data, valor: m[chave] as number })),
  })).filter((g) => g.pontos.length >= 2)

  if (graficos.length === 0) {
    return (
      <p className="hint">
        Registre a mesma medida em pelo menos dois dias diferentes pra ver a evolução aqui.
      </p>
    )
  }

  return (
    <div className="evolucao-medidas-lista">
      {graficos.map((g) => (
        <div key={g.label} className="evolucao-medida-item">
          <span className="hint">{g.label}</span>
          <div style={{ height: 90 }}>
            <Line
              data={{
                labels: g.pontos.map((p) => formatDataBR(p.data)),
                datasets: [
                  {
                    data: g.pontos.map((p) => p.valor),
                    borderColor: corCss('--accent'),
                    backgroundColor: corCss('--accent-soft'),
                    tension: 0.3,
                    fill: true,
                    pointRadius: 2,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: corCss('--text-muted'), maxTicksLimit: 4 }, grid: { display: false } },
                  y: { ticks: { color: corCss('--text-muted') }, grid: { color: corCss('--border-subtle') } },
                },
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
