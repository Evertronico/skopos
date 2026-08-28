import { COR_NIVEL_ESTIMULO, type EstimuloGrupo } from '../lib/estimuloMuscular'

interface Props {
  estimulos: Record<string, EstimuloGrupo>
}

function nivelDe(estimulos: Record<string, EstimuloGrupo>, grupo: string) {
  return estimulos[grupo]?.nivel ?? 'nenhum'
}

// Sem stroke nos segmentos neutros: como todos compartilham o mesmo fill, as sobreposições
// entre eles somem e a silhueta lê como um corpo contínuo em vez de peças de boneco encaixadas.
const BASE = { fill: 'var(--surface-alt)' }

/** Corpo humano estilizado (frente + costas) com cada região colorida pelo nível de estímulo semanal do grupo muscular. */
export function MuscleMap({ estimulos }: Props) {
  const musculo = (grupo: string) => {
    const nivel = nivelDe(estimulos, grupo)
    return {
      fill: COR_NIVEL_ESTIMULO[nivel],
      stroke: nivel === 'nenhum' ? 'none' : 'var(--surface)',
      strokeWidth: 1.5,
      className: 'muscle-map-regiao',
    }
  }

  return (
    <div className="muscle-map">
      <div className="muscle-map-corpo">
        <svg viewBox="0 0 160 340" width="100%" height="100%" aria-hidden="true">
          {/* cabeça, pescoço, tronco, membros — silhueta neutra */}
          <ellipse cx="80" cy="22" rx="14" ry="16" {...BASE} />
          <rect x="72" y="35" width="16" height="11" rx="4" {...BASE} />
          <path d="M52,54 Q80,44 108,54 L104,66 Q80,58 56,66 Z" {...BASE} />
          <path d="M58,60 L102,60 L98,168 Q80,176 62,168 Z" {...BASE} />
          <path d="M62,166 L98,166 L102,184 Q80,192 58,184 Z" {...BASE} />
          <rect x="30" y="60" width="15" height="76" rx="7.5" {...BASE} />
          <rect x="115" y="60" width="15" height="76" rx="7.5" {...BASE} />
          <ellipse cx="37" cy="140" rx="7" ry="8" {...BASE} />
          <ellipse cx="123" cy="140" rx="7" ry="8" {...BASE} />
          <rect x="57" y="184" width="20" height="72" rx="9" {...BASE} />
          <rect x="83" y="184" width="20" height="72" rx="9" {...BASE} />
          <rect x="58" y="256" width="17" height="60" rx="7" {...BASE} />
          <rect x="85" y="256" width="17" height="60" rx="7" {...BASE} />
          <ellipse cx="66" cy="322" rx="10" ry="6" {...BASE} />
          <ellipse cx="94" cy="322" rx="10" ry="6" {...BASE} />

          {/* regiões coloridas por estímulo */}
          <ellipse cx="46" cy="64" rx="13" ry="15" {...musculo('Ombro')} />
          <ellipse cx="114" cy="64" rx="13" ry="15" {...musculo('Ombro')} />
          <path d="M62,64 Q80,57 98,64 L95,98 Q80,106 65,98 Z" {...musculo('Peito')} />
          <rect x="69" y="102" width="22" height="58" rx="9" {...musculo('Abdômen')} />
          <rect x="31" y="70" width="13" height="42" rx="6.5" {...musculo('Bíceps')} />
          <rect x="116" y="70" width="13" height="42" rx="6.5" {...musculo('Bíceps')} />
          <rect x="59" y="188" width="16" height="60" rx="8" {...musculo('Pernas')} />
          <rect x="85" y="188" width="16" height="60" rx="8" {...musculo('Pernas')} />
        </svg>
        <span className="muscle-map-legenda-vista">Frente</span>
      </div>

      <div className="muscle-map-corpo">
        <svg viewBox="0 0 160 340" width="100%" height="100%" aria-hidden="true">
          <ellipse cx="80" cy="22" rx="14" ry="16" {...BASE} />
          <rect x="72" y="35" width="16" height="11" rx="4" {...BASE} />
          <path d="M52,54 Q80,44 108,54 L104,66 Q80,58 56,66 Z" {...BASE} />
          <path d="M58,60 L102,60 L98,168 Q80,176 62,168 Z" {...BASE} />
          <rect x="30" y="60" width="15" height="76" rx="7.5" {...BASE} />
          <rect x="115" y="60" width="15" height="76" rx="7.5" {...BASE} />
          <ellipse cx="37" cy="140" rx="7" ry="8" {...BASE} />
          <ellipse cx="123" cy="140" rx="7" ry="8" {...BASE} />
          <rect x="57" y="184" width="20" height="72" rx="9" {...BASE} />
          <rect x="83" y="184" width="20" height="72" rx="9" {...BASE} />
          <rect x="58" y="256" width="17" height="60" rx="7" {...BASE} />
          <rect x="85" y="256" width="17" height="60" rx="7" {...BASE} />
          <ellipse cx="66" cy="322" rx="10" ry="6" {...BASE} />
          <ellipse cx="94" cy="322" rx="10" ry="6" {...BASE} />

          <ellipse cx="46" cy="64" rx="13" ry="15" {...musculo('Ombro')} />
          <ellipse cx="114" cy="64" rx="13" ry="15" {...musculo('Ombro')} />
          <path d="M60,60 Q80,52 100,60 L97,150 Q80,158 63,150 Z" {...musculo('Costas')} />
          <rect x="31" y="70" width="13" height="42" rx="6.5" {...musculo('Tríceps')} />
          <rect x="116" y="70" width="13" height="42" rx="6.5" {...musculo('Tríceps')} />
          <ellipse cx="80" cy="180" rx="23" ry="15" {...musculo('Glúteos')} />
          <rect x="59" y="188" width="16" height="60" rx="8" {...musculo('Pernas')} />
          <rect x="85" y="188" width="16" height="60" rx="8" {...musculo('Pernas')} />
          <rect x="59" y="260" width="15" height="52" rx="7" {...musculo('Panturrilha')} />
          <rect x="86" y="260" width="15" height="52" rx="7" {...musculo('Panturrilha')} />
        </svg>
        <span className="muscle-map-legenda-vista">Costas</span>
      </div>
    </div>
  )
}
