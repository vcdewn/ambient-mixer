import { useApp } from '../state/AppContext'
import type { BgPreset } from '../state/types'

const PRESETS: BgPreset[] = ['night', 'sunset', 'misty']

/** Three stacked gradients; switching presets cross-fades their opacity. */
export function Background() {
  const { state } = useApp()
  return (
    <div aria-hidden="true">
      {PRESETS.map((p) => (
        <div key={p} className={`bg-layer bg-${p}`} data-active={state.bgPreset === p}>
          <div className="bg-gradient" />
          <div className="blob" />
          <div className="blob" />
          <div className="blob" />
        </div>
      ))}
    </div>
  )
}
