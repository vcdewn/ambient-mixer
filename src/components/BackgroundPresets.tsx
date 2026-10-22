import { useApp, useT } from '../state/AppContext'
import type { BgPreset } from '../state/types'

const SWATCH: Record<BgPreset, string> = {
  night: 'radial-gradient(circle at 28% 24%, #6a58d6 0%, transparent 55%), radial-gradient(circle at 78% 82%, #1f6f93 0%, transparent 60%), linear-gradient(135deg, #1a1244, #0a0818)',
  sunset: 'radial-gradient(circle at 28% 24%, #d9906a 0%, transparent 55%), radial-gradient(circle at 78% 82%, #7a3f9e 0%, transparent 60%), linear-gradient(135deg, #8a3a56, #25101f)',
  moss: 'radial-gradient(circle at 28% 24%, #5f9c7e 0%, transparent 55%), radial-gradient(circle at 78% 82%, #2a6a72 0%, transparent 60%), linear-gradient(135deg, #17382d, #07120f)',
}

export function BackgroundPresets() {
  const { state, dispatch } = useApp()
  const t = useT()
  return (
    <div role="radiogroup" aria-label={t.background} className="flex items-center gap-2">
      {(Object.keys(SWATCH) as BgPreset[]).map((p) => (
        <button key={p} role="radio" aria-checked={state.bgPreset === p} aria-label={t.presets[p]} title={t.presets[p]}
          onClick={() => dispatch({ type: 'SET_BG', preset: p })}
          className="swatch h-8 w-8 rounded-full transition duration-300 hover:scale-110"
          data-on={state.bgPreset === p}
          style={{ background: SWATCH[p] }} />
      ))}
    </div>
  )
}
