export interface ItemMedida {
  label: string
  atual: number
  meta: number | null
}

interface Props {
  itens: ItemMedida[]
}

export function MeasurementsProgress({ itens }: Props) {
  if (itens.length === 0) {
    return <p className="hint">Registre ao menos uma medida pra ver a comparação com a meta aqui.</p>
  }

  return (
    <div className="medidas-progresso-lista">
      {itens.map((item) => {
        const temMeta = item.meta !== null
        const max = Math.max(item.atual, item.meta ?? 0) * 1.15 || 1
        const pctAtual = Math.min(100, (item.atual / max) * 100)
        const pctMeta = temMeta ? Math.min(100, ((item.meta as number) / max) * 100) : null

        return (
          <div key={item.label} className="medida-progresso-item">
            <div className="medida-progresso-topo">
              <span className="medida-progresso-label">{item.label}</span>
              <span className="medida-progresso-valores">
                <strong>{item.atual}</strong>
                {temMeta && <span className="hint"> → meta {item.meta}</span>}
              </span>
            </div>
            <div className="medida-progresso-trilha">
              <div className="medida-progresso-preenchimento" style={{ width: `${pctAtual}%` }} />
              {pctMeta !== null && <div className="medida-progresso-marcador" style={{ left: `${pctMeta}%` }} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
