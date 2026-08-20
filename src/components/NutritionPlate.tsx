interface AnelProps {
  label: string
  percentual: number
  cor: string
}

function AnelProgresso({ label, percentual, cor }: AnelProps) {
  const p = Math.max(0, Math.min(100, percentual))
  return (
    <div className="anel-progresso">
      <div className="anel-circulo" style={{ background: `conic-gradient(${cor} ${p * 3.6}deg, var(--surface-alt) 0deg)` }}>
        <div className="anel-centro">{Math.round(percentual)}%</div>
      </div>
      <span className="anel-label">{label}</span>
    </div>
  )
}

interface Props {
  calorias: number
  proteina: number
  carboidratos: number
  gordura: number
}

export function NutritionPlate({ calorias, proteina, carboidratos, gordura }: Props) {
  return (
    <div className="prato-grid">
      <AnelProgresso label="Calorias" percentual={calorias} cor="var(--accent)" />
      <AnelProgresso label="Proteína" percentual={proteina} cor="var(--highlight)" />
      <AnelProgresso label="Carboidratos" percentual={carboidratos} cor="var(--warning)" />
      <AnelProgresso label="Gordura" percentual={gordura} cor="#f472b6" />
    </div>
  )
}
