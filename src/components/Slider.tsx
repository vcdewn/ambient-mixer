import type { CSSProperties } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
  label: string
  disabled?: boolean
}

export function Slider({ value, onChange, label, disabled }: Props) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(value * 100)}
      disabled={disabled}
      aria-label={label}
      style={{ '--fill': `${Math.round(value * 100)}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
    />
  )
}
