import { useId } from 'react'

interface Props {
  percentual: number
}

export function WaterBottle({ percentual }: Props) {
  const clipId = useId()
  const preenchido = Math.max(0, Math.min(100, percentual))
  const areaPreenchivel = 50
  const yTopo = 8 + (areaPreenchivel * (100 - preenchido)) / 100

  return (
    <div className="garrafinha-wrap">
      <svg viewBox="0 0 40 64" width="56" height="90">
        <defs>
          <clipPath id={clipId}>
            <path d="M14 4h12v7c4.5 2 6.5 6 6.5 10.5v34a4 4 0 0 1-4 4H11.5a4 4 0 0 1-4-4v-34c0-4.5 2-8.5 6.5-10.5z" />
          </clipPath>
        </defs>
        <rect x="15" y="1" width="10" height="4.5" rx="1" className="garrafinha-contorno" fill="currentColor" />
        <g clipPath={`url(#${clipId})`}>
          <rect x="4" y="4" width="32" height="60" fill="var(--surface-alt)" />
          <rect x="4" y={yTopo} width="32" height="60" className="garrafinha-liquido" />
        </g>
        <path
          d="M14 4h12v7c4.5 2 6.5 6 6.5 10.5v34a4 4 0 0 1-4 4H11.5a4 4 0 0 1-4-4v-34c0-4.5 2-8.5 6.5-10.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="garrafinha-contorno"
        />
      </svg>
      <span className="garrafinha-percentual">{Math.round(percentual)}%</span>
      <span className="hint">água hoje</span>
    </div>
  )
}
