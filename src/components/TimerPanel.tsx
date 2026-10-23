import { useEffect, useState, type ReactNode } from 'react'
import { Armchair, Bell, Brain, Coffee, Minus, Pause, Play, Plus, Repeat, RotateCcw, SkipForward, SlidersHorizontal } from 'lucide-react'
import { useEngine } from '../audio/EngineContext'
import { LIMITS } from '../state/reducer'
import { useApp, useT } from '../state/AppContext'
import type { FocusSettings, TimerMode } from '../state/types'
import { formatClock } from '../timers/format'
import { phaseMs, type FocusRun } from '../timers/focus'
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

function IconButton({ label, onClick, pressed, children }: {
  label: string; onClick: () => void; pressed?: boolean; children: ReactNode
}) {
  return (
    <button className="glass-btn flex h-9 w-9 items-center justify-center" title={label} aria-label={label}
      aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}

function Stepper({ icon, label, value, min, max, prefix = '', onChange }: {
  icon: ReactNode; label: string; value: number; min: number; max: number; prefix?: string; onChange: (n: number) => void
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)))
  return (
    <div className="glass-btn flex items-center gap-1 py-1 pl-3 pr-1 text-sm" title={label} role="group" aria-label={label}>
      <span style={{ color: 'var(--fg-soft)' }}>{icon}</span>
      <button className="flex h-6 w-6 items-center justify-center rounded-full" aria-label={`${label} −`} onClick={() => set(value - 1)}><Minus size={13} aria-hidden="true" /></button>
      <span className="min-w-[2.2ch] text-center font-medium tabular-nums">{prefix}{value}</span>
      <button className="flex h-6 w-6 items-center justify-center rounded-full" aria-label={`${label} +`} onClick={() => set(value + 1)}><Plus size={13} aria-hidden="true" /></button>
    </div>
  )
}

/** The whole cycle on one line: segment width = minutes, the fill shows progress. */
function CycleBar({ settings: s, run, left }: { settings: FocusSettings; run: FocusRun; left: number }) {
  const segs: { ms: number; kind: 'work' | 'break' | 'long' }[] = []
  for (let i = 0; i < s.cyclesBeforeLong; i++) {
    segs.push({ ms: phaseMs('work', s), kind: 'work' })
    const last = i === s.cyclesBeforeLong - 1
    segs.push({ ms: phaseMs(last ? 'longBreak' : 'break', s), kind: last ? 'long' : 'break' })
  }
  const current = run.phase === 'work' ? run.cycle * 2 : run.phase === 'longBreak' ? segs.length - 1 : Math.max(0, run.cycle - 1) * 2 + 1
  const frac = 1 - left / Math.max(1, phaseMs(run.phase, s))
  return (
    <div className="flex h-2.5 gap-[3px]" aria-hidden="true">
      {segs.map((seg, i) => {
        const fill = i < current ? 1 : i === current ? frac : 0
        return (
          <div key={i} className="relative overflow-hidden rounded-full"
            style={{ flex: seg.ms, background: `color-mix(in srgb, var(--accent) ${seg.kind === 'work' ? 22 : 10}%, transparent)`, opacity: seg.kind === 'work' ? 1 : 0.8 }}>
            <div className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${fill * 100}%`, background: seg.kind === 'work' ? 'var(--accent)' : 'var(--fg-soft)', transition: 'width 0.5s linear' }} />
          </div>
        )
      })}
    </div>
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

  const [showSettings, setShowSettings] = useState(false)
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-semibold tabular-nums" role="timer">{formatClock(focus.left)}</div>
              <div className="text-sm" style={{ color: 'var(--fg-soft)' }} aria-live="polite">
                {label} · {focus.run.cycle}/{f.cyclesBeforeLong}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {running ? (
                <button className="btn-primary flex items-center gap-2 px-4 py-2" onClick={focus.pause}>
                  <Pause size={16} aria-hidden="true" /> {t.focus.pause}
                </button>
              ) : (
                <button className="btn-primary flex items-center gap-2 px-4 py-2" onClick={focus.start}>
                  <Play size={16} aria-hidden="true" /> {focus.run.status === 'paused' ? t.focus.resume : t.focus.start}
                </button>
              )}
              <IconButton label={t.focus.reset} onClick={focus.reset}><RotateCcw size={16} aria-hidden="true" /></IconButton>
              <IconButton label={focus.run.phase === 'work' ? t.focus.breakNow : t.focus.skip} onClick={focus.skip}>
                {focus.run.phase === 'work' ? <Coffee size={16} aria-hidden="true" /> : <SkipForward size={16} aria-hidden="true" />}
              </IconButton>
              <IconButton label={t.focus.settings} pressed={showSettings} onClick={() => setShowSettings((v) => !v)}>
                <SlidersHorizontal size={16} aria-hidden="true" />
              </IconButton>
            </div>
          </div>

          <CycleBar settings={f} run={focus.run} left={focus.left} />

          {showSettings && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Stepper icon={<Brain size={15} aria-hidden="true" />} label={t.focus.workMin} value={f.workMin} min={LIMITS.focusMin} max={LIMITS.focusMax} onChange={(workMin) => setF({ workMin })} />
              <Stepper icon={<Coffee size={15} aria-hidden="true" />} label={t.focus.breakMin} value={f.breakMin} min={LIMITS.focusMin} max={LIMITS.focusMax} onChange={(breakMin) => setF({ breakMin })} />
              <Stepper icon={<Armchair size={15} aria-hidden="true" />} label={t.focus.longBreakMin} value={f.longBreakMin} min={LIMITS.focusMin} max={LIMITS.focusMax} onChange={(longBreakMin) => setF({ longBreakMin })} />
              <Stepper icon={<Repeat size={15} aria-hidden="true" />} label={t.focus.cycles} value={f.cyclesBeforeLong} min={LIMITS.cyclesMin} max={LIMITS.cyclesMax} prefix="×" onChange={(cyclesBeforeLong) => setF({ cyclesBeforeLong })} />
              <span className="mx-1 h-5 w-px" style={{ background: 'var(--glass-border)' }} aria-hidden="true" />
              <IconButton label={t.focus.autoAdvance} pressed={f.autoAdvance} onClick={() => setF({ autoAdvance: !f.autoAdvance })}><SkipForward size={16} aria-hidden="true" /></IconButton>
              <IconButton label={t.focus.chime} pressed={f.chime} onClick={() => setF({ chime: !f.chime })}><Bell size={16} aria-hidden="true" /></IconButton>
            </div>
          )}
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
