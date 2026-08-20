import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function FloatingInput({ label, id, ...props }: Props) {
  const inputId = id ?? `campo-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="campo-flutuante">
      <input id={inputId} placeholder=" " {...props} />
      <label htmlFor={inputId}>{label}</label>
    </div>
  )
}
