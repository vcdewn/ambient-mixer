import { useApp, useT } from '../state/AppContext'
import type { BgPreset } from '../state/types'

const SWATCH: Record<BgPreset, string> = {
  night: 'linear-gradient(135deg, #0f0b24, #6d4aff)',
  sunset: 'linear-gradient(135deg, #b3445f, #ffb26b)',
  misty: 'linear-gradient(135deg, #cfdde6, #a8d5ce)',
}

export function BackgroundPresets() {
  const { state, dispatch } = useApp()
  const t = useT()
  return (
    <div role="radiogroup" aria-label={t.background} className="flex items-center gap-2">
      {(Object.keys(SWATCH) as BgPreset[]).map((p) => (
        <button key={p} role="radio" aria-checked={state.bgPreset === p} aria-label={t.presets[p]} title={t.presets[p]}
          onClick={() => dispatch({ type: 'SET_BG', preset: p })}
          className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            background: SWATCH[p],
            borderColor: state.bgPreset === p ? 'var(--accent)' : 'var(--glass-border)',
            boxShadow: state.bgPreset === p ? '0 0 0 2px var(--glass-strong)' : undefined,
          }} />
      ))}
    </div>
  )
}
