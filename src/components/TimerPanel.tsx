import { useEffect } from 'react'
import { Pause, Play, RotateCcw, SkipForward, Coffee } from 'lucide-react'
import { useEngine } from '../audio/EngineContext'
import { LIMITS } from '../state/reducer'
import { useApp, useT } from '../state/AppContext'
import type { TimerMode } from '../state/types'
import { formatClock } from '../timers/format'
import { useFocusTimer } from '../timers/useFocusTimer'
import { useSleepTimer } from '../timers/useSleepTimer'

const MODES: TimerMode[] = ['focus', 'sleep', 'off']
const SLEEP_PRESETS = [30, 60, 120, 240]

function NumberField({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <input type="number" inputMode="numeric" min={min} max={max} value={value}
        onChange={(e) => { if (e.target.value !== '') onChange(Number(e.target.value)) }} />
    </label>
  )
}

export function TimerPanel() {
  const { state, dispatch } = useApp()
  const { engine } = useEngine()
  const t = useT()
  const mode = state.timerMode

  const focus = useFocusTimer(state.focus, (_finished, next) => {
    if (state.focus.chime) engine.playChime(next === 'work' ? 'work' : 'break')
  })
  const sleep = useSleepTimer(engine, () => dispatch({ type: 'SET_MASTER_PLAYING', playing: false }))

  const { reset: resetFocus } = focus
  const { cancel: cancelSleep } = sleep
  // only one mode runs at a time: leaving a mode resets it
  useEffect(() => {
    if (mode !== 'focus') resetFocus()
    if (mode !== 'sleep') cancelSleep()
  }, [mode, resetFocus, cancelSleep])

  // countdown in the tab title
  const label = t.focus[focus.run.phase]
  const running = focus.run.status === 'running'
  useEffect(() => {
    let title = t.appName
    if (mode === 'focus' && running) title = `${focus.run.phase === 'work' ? '🍅' : '☕'} ${formatClock(focus.left)} · ${label}`
    else if (mode === 'sleep' && sleep.run.status === 'running') title = `🌙 ${formatClock(sleep.left)} · ${t.modes.sleep}`
    document.title = title
    return () => { document.title = t.appName }
  }, [mode, running, focus.left, focus.run.phase, label, sleep.run.status, sleep.left, t])

  const f = state.focus
  const setF = (patch: Partial<typeof f>) => dispatch({ type: 'SET_FOCUS', patch })

  return (
    <section className="glass p-4 sm:p-5 flex flex-col gap-4" aria-label={t.timer}>
      <div role="tablist" aria-label={t.timer} className="glass-btn inline-flex self-start p-0.5 text-sm font-medium">
        {MODES.map((m) => (
          <button key={m} role="tab" aria-selected={mode === m}
            onClick={() => dispatch({ type: 'SET_TIMER_MODE', mode: m })}
            className="rounded-full px-4 py-1.5 transition-colors"
            style={mode === m ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : undefined}>
            {t.modes[m]}
          </button>
        ))}
      </div>

      {mode === 'off' && <p className="text-sm" style={{ color: 'var(--fg-soft)' }}>{t.offHint}</p>}

      {mode === 'focus' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <div className="text-sm" style={{ color: 'var(--fg-soft)' }} aria-live="polite">
                {label} · {focus.run.cycle}/{f.cyclesBeforeLong}
              </div>
              <div className="text-5xl font-semibold tabular-nums" role="timer">{formatClock(focus.left)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {running ? (
                <button className="btn-primary flex items-center gap-2 px-5 py-2.5" onClick={focus.pause}>
                  <Pause size={18} aria-hidden="true" /> {t.focus.pause}
                </button>
              ) : (
                <button className="btn-primary flex items-center gap-2 px-5 py-2.5" onClick={focus.start}>
                  <Play size={18} aria-hidden="true" /> {focus.run.status === 'paused' ? t.focus.resume : t.focus.start}
                </button>
              )}
              <button className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm" onClick={focus.reset}>
                <RotateCcw size={16} aria-hidden="true" /> {t.focus.reset}
              </button>
              <button className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm" onClick={focus.skip}>
                {focus.run.phase === 'work'
                  ? <><Coffee size={16} aria-hidden="true" /> {t.focus.breakNow}</>
                  : <><SkipForward size={16} aria-hidden="true" /> {t.focus.skip}</>}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t pt-4" style={{ borderColor: 'var(--glass-border)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--fg-soft)' }}>{t.focus.settings}</h3>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <NumberField label={t.focus.workMin} value={f.workMin} min={LIMITS.focusMin} max={LIMITS.focusMax} onChange={(workMin) => setF({ workMin })} />
              <NumberField label={t.focus.breakMin} value={f.breakMin} min={LIMITS.focusMin} max={LIMITS.focusMax} onChange={(breakMin) => setF({ breakMin })} />
              <NumberField label={t.focus.longBreakMin} value={f.longBreakMin} min={LIMITS.focusMin} max={LIMITS.focusMax} onChange={(longBreakMin) => setF({ longBreakMin })} />
              <NumberField label={t.focus.cycles} value={f.cyclesBeforeLong} min={LIMITS.cyclesMin} max={LIMITS.cyclesMax} onChange={(cyclesBeforeLong) => setF({ cyclesBeforeLong })} />
            </div>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.autoAdvance} onChange={(e) => setF({ autoAdvance: e.target.checked })} /> {t.focus.autoAdvance}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.chime} onChange={(e) => setF({ chime: e.target.checked })} /> {t.focus.chime}
              </label>
            </div>
          </div>
        </div>
      )}

      {mode === 'sleep' && (
        <div className="flex flex-col gap-3">
          {sleep.run.status === 'idle' ? (
            <>
              <div className="text-sm" style={{ color: 'var(--fg-soft)' }}>{t.sleep.title}</div>
              <div className="flex flex-wrap items-center gap-2">
                {SLEEP_PRESETS.map((m) => (
                  <button key={m} className="glass-btn px-4 py-2 text-sm" aria-pressed={state.sleepMinutes === m}
                    onClick={() => dispatch({ type: 'SET_SLEEP_MINUTES', minutes: m })}>
                    {t.sleep.presets[m]}
                  </button>
                ))}
                <NumberField label={t.sleep.custom} value={state.sleepMinutes} min={LIMITS.sleepMin} max={LIMITS.sleepMax}
                  onChange={(minutes) => dispatch({ type: 'SET_SLEEP_MINUTES', minutes })} />
              </div>
              <div>
                <button className="btn-primary px-6 py-2.5" onClick={() => sleep.start(state.sleepMinutes)}>{t.sleep.start}</button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <div className="text-sm" style={{ color: 'var(--fg-soft)' }} aria-live="polite">
                  {sleep.run.status === 'fading' ? t.sleep.fading : t.sleep.left}
                </div>
                <div className="text-5xl font-semibold tabular-nums" role="timer">
                  {sleep.run.status === 'fading' ? '··:··' : formatClock(sleep.left)}
                </div>
              </div>
              <div className="flex gap-2">
                {sleep.run.status === 'running' && (
                  <button className="glass-btn px-4 py-2.5 text-sm" onClick={sleep.extend}>{t.sleep.extend}</button>
                )}
                <button className="glass-btn px-4 py-2.5 text-sm" onClick={sleep.cancel}>{t.sleep.cancel}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
