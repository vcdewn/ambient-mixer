import { Pause, Play, Volume2 } from 'lucide-react'
import { useApp, useT } from '../state/AppContext'
import { Slider } from './Slider'

export function MasterControl() {
  const { state, dispatch } = useApp()
  const t = useT()
  const playing = state.masterPlaying
  return (
    <section className="glass p-4 sm:p-5 flex items-center gap-4" aria-label={t.masterVolume}>
      <button
        className="btn-primary flex h-14 w-14 shrink-0 items-center justify-center"
        aria-label={playing ? t.pause : t.play}
        onClick={() => dispatch({ type: 'SET_MASTER_PLAYING', playing: !playing })}>
        {playing ? <Pause size={26} aria-hidden="true" /> : <Play size={26} aria-hidden="true" className="ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--fg-soft)' }}>
          <Volume2 size={16} aria-hidden="true" /> {t.masterVolume}
        </div>
        <Slider value={state.masterVolume} label={t.masterVolume}
          onChange={(volume) => dispatch({ type: 'SET_MASTER_VOLUME', volume })} />
      </div>
    </section>
  )
}
