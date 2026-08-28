import { useId, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function FloatingInput({ label, id, className, ...props }: Props) {
  const idGerado = useId()
  const inputId = id ?? idGerado
  return (
    <div className={className ? `campo-flutuante ${className}` : 'campo-flutuante'}>
      <input id={inputId} placeholder=" " {...props} />
      <label htmlFor={inputId}>{label}</label>
    </div>
  )
}
