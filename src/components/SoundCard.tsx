import type { CSSProperties } from 'react'
import { RotateCw } from 'lucide-react'
import type { SoundDef } from '../data/sounds'
import { useEngine } from '../audio/EngineContext'
import { useApp, useT } from '../state/AppContext'
import { Slider } from './Slider'
import { SoundScene } from './SoundScene'

export function SoundCard({ sound }: { sound: SoundDef }) {
  const { state, dispatch } = useApp()
  const { engine, statuses } = useEngine()
  const t = useT()
  const track = state.tracks[sound.id]
  const status = statuses[sound.id]
  const name = t.sounds[sound.id]
  const failed = status === 'error'
  const loading = status === 'idle' || status === 'loading'
  const Icon = sound.icon
  const live = track.enabled && state.masterPlaying && status === 'ready'

  return (
    <div className={`glass sound-card p-5 flex flex-col gap-4 ${track.enabled ? '' : 'opacity-80'}`}
      data-on={track.enabled} style={{ '--sc': sound.color } as CSSProperties}>
      {live && <SoundScene id={sound.id} level={track.volume} />}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`shrink-0 ${live ? 'icon-live' : ''}`} size={28} aria-hidden="true"
            style={{ color: track.enabled ? 'var(--accent)' : 'var(--fg-soft)' }} />
          <div className="min-w-0">
            <div className="font-semibold truncate">{name}</div>
            {failed && <div className="text-xs" style={{ color: 'var(--fg-soft)' }}>{t.unavailable}</div>}
            {loading && state.started && <div className="text-xs" style={{ color: 'var(--fg-soft)' }}>{t.loading}</div>}
          </div>
        </div>

        {failed ? (
          <button className="glass-btn px-3 py-1.5 text-sm flex items-center gap-1.5"
            onClick={() => void engine.retry(sound.id)}>
            <RotateCw size={14} aria-hidden="true" /> {t.retry}
          </button>
        ) : (
          <button role="switch" aria-checked={track.enabled} aria-label={name}
            disabled={loading && state.started}
            onClick={() => dispatch({ type: 'TOGGLE_TRACK', id: sound.id })}
            className="relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-50"
            style={{
              background: track.enabled ? 'var(--accent)' : 'var(--glass)',
              borderColor: 'var(--glass-border)',
            }}>
            <span className="absolute top-0.5 h-5 w-5 rounded-full shadow transition-all"
              style={{ background: '#dcdae6', left: track.enabled ? '1.5rem' : '0.125rem' }} />
          </button>
        )}
      </div>

      <Slider value={track.volume} label={`${name} — ${t.volume}`} disabled={!track.enabled || failed}
        onChange={(volume) => dispatch({ type: 'SET_VOLUME', id: sound.id, volume })} />
    </div>
  )
}
