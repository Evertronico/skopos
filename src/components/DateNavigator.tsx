import { useRef, type PointerEvent } from 'react'
import { adicionarDias, rotuloDia } from '../lib/date'
import { IconChevronLeft, IconChevronRight } from './icons'

interface Props {
  data: string
  onChange: (novaData: string) => void
}

const LIMIAR_ARRASTE_PX = 45

export function DateNavigator({ data, onChange }: Props) {
  const inicioX = useRef<number | null>(null)

  function irPara(delta: number) {
    onChange(adicionarDias(data, delta))
  }

  function handlePointerDown(e: PointerEvent) {
    inicioX.current = e.clientX
  }

  function handlePointerUp(e: PointerEvent) {
    if (inicioX.current === null) return
    const delta = e.clientX - inicioX.current
    inicioX.current = null
    if (Math.abs(delta) < LIMIAR_ARRASTE_PX) return
    irPara(delta > 0 ? -1 : 1)
  }

  return (
    <div className="date-nav" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <button type="button" className="icon-neutro" onClick={() => irPara(-1)} aria-label="Dia anterior">
        <IconChevronLeft size={18} />
      </button>

      <label className="date-nav-label">
        <span>{rotuloDia(data)}</span>
        <input type="date" value={data} onChange={(e) => onChange(e.target.value)} aria-label="Escolher data" />
      </label>

      <button type="button" className="icon-neutro" onClick={() => irPara(1)} aria-label="Próximo dia">
        <IconChevronRight size={18} />
      </button>
    </div>
  )
}
