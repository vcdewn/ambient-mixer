import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bell, Coffee, Minus, Pause, Play, Plus, Repeat, RotateCcw, SkipForward } from 'lucide-react'
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

type SegKind = 'work' | 'break' | 'long'
const KIND_FIELD = { work: 'workMin', break: 'breakMin', long: 'longBreakMin' } as const

interface Drag { kind: SegKind; count: number; startX: number; startVal: number; pxPerMin: number; total: number }

/**
 * The whole cycle on one line: segment width = minutes, the fill shows progress.
 * Drag a segment's right edge (or use ←/→) to change its length; click the label to type minutes.
 */
function Timeline({ settings: s, run, left, onChange, labels }: {
  settings: FocusSettings; run: FocusRun; left: number
  onChange: (patch: Partial<FocusSettings>) => void
  labels: Record<SegKind, string>
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [editing, setEditing] = useState<number | null>(null)

  const segs: { kind: SegKind; ms: number; nth: number }[] = []
  const seen = { work: 0, break: 0, long: 0 }
  const push = (kind: SegKind, phase: 'work' | 'break' | 'longBreak') => segs.push({ kind, ms: phaseMs(phase, s), nth: ++seen[kind] })
  for (let i = 0; i < s.cyclesBeforeLong; i++) {
    push('work', 'work')
    if (i === s.cyclesBeforeLong - 1) push('long', 'longBreak')
    else push('break', 'break')
  }
  const totalMin = segs.reduce((n, g) => n + g.ms / 60_000, 0)
  const current = run.phase === 'work' ? run.cycle * 2 : run.phase === 'longBreak' ? segs.length - 1 : Math.max(0, run.cycle - 1) * 2 + 1
  const frac = 1 - left / Math.max(1, phaseMs(run.phase, s))

  const { focusMin: lo, focusMax: hi } = LIMITS
  const set = (kind: SegKind, v: number) => onChange({ [KIND_FIELD[kind]]: Math.min(hi, Math.max(lo, Math.round(v))) })

  const startDrag = (e: React.PointerEvent, kind: SegKind, nth: number) => {
    const width = barRef.current?.getBoundingClientRect().width ?? 1
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ kind, count: nth, startX: e.clientX, startVal: s[KIND_FIELD[kind]], pxPerMin: width / totalMin, total: totalMin })
  }
  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return
    set(drag.kind, drag.startVal + (e.clientX - drag.startX) / (drag.pxPerMin * drag.count))
  }

  const fmtTotal = `${Math.floor(totalMin / 60)}:${String(Math.round(totalMin % 60)).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3">
      <div ref={barRef} className="flex h-9 flex-1 gap-[3px] select-none" style={{ touchAction: 'none' }}>
        {segs.map((seg, i) => {
          const fill = i < current ? 1 : i === current ? frac : 0
          const min = seg.ms / 60_000
          const tone = seg.kind === 'work' ? 'var(--accent)' : seg.kind === 'break' ? 'var(--fg-soft)' : '#9fd4b8'
          const width = drag ? { flex: `0 0 ${(min / drag.total) * 100}%` } : { flex: `${min} 1 0` }
          return (
            <div key={i} className="relative min-w-0 rounded-lg" style={{ ...width, background: `color-mix(in srgb, ${tone} 18%, transparent)` }}>
              <div className="absolute inset-0 overflow-hidden rounded-lg" aria-hidden="true">
                <div className="absolute inset-y-0 left-0" style={{ width: `${fill * 100}%`, background: `color-mix(in srgb, ${tone} 45%, transparent)`, transition: drag ? 'none' : 'width 0.5s linear' }} />
              </div>
              <div className="relative flex h-full items-center justify-center text-xs font-medium tabular-nums"
                style={i === current ? { boxShadow: `inset 0 0 0 1.5px ${tone}`, borderRadius: 8 } : undefined}>
                {editing === i ? (
                  <input type="number" autoFocus defaultValue={Math.round(min)} min={lo} max={hi}
                    aria-label={labels[seg.kind]} className="h-6 w-full max-w-12 px-0 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => { if (e.target.value !== '') set(seg.kind, Number(e.target.value)); setEditing(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(null) }} />
                ) : (
                  <button className="h-full w-full truncate px-1" title={labels[seg.kind]} aria-label={`${labels[seg.kind]}: ${Math.round(min)}`}
                    onClick={() => setEditing(i)}>
                    {Math.round(min)}
                  </button>
                )}
              </div>
              <div role="slider" tabIndex={0} aria-label={labels[seg.kind]} aria-valuemin={lo} aria-valuemax={hi} aria-valuenow={Math.round(min)}
                className="group absolute -right-[5px] top-0 z-10 flex h-full w-[9px] cursor-ew-resize items-center justify-center outline-offset-0"
                onPointerDown={(e) => startDrag(e, seg.kind, seg.nth)}
                onPointerMove={moveDrag} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(seg.kind, min + 1) }
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(seg.kind, min - 1) }
                }}>
                <span className="h-4 w-[3px] rounded-full opacity-40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" style={{ background: 'var(--fg)' }} />
              </div>
            </div>
          )
        })}
      </div>
      <span className="text-xs tabular-nums" style={{ color: 'var(--fg-soft)' }} title={labels.work}>{fmtTotal}</span>
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
            </div>
          </div>

          <Timeline settings={f} run={focus.run} left={focus.left} onChange={setF}
            labels={{ work: t.focus.workMin, break: t.focus.breakMin, long: t.focus.longBreakMin }} />

          <div className="flex flex-wrap items-center gap-2">
            <Stepper icon={<Repeat size={15} aria-hidden="true" />} label={t.focus.cycles} value={f.cyclesBeforeLong} min={LIMITS.cyclesMin} max={LIMITS.cyclesMax} prefix="×" onChange={(cyclesBeforeLong) => setF({ cyclesBeforeLong })} />
            <IconButton label={t.focus.autoAdvance} pressed={f.autoAdvance} onClick={() => setF({ autoAdvance: !f.autoAdvance })}><SkipForward size={16} aria-hidden="true" /></IconButton>
            <IconButton label={t.focus.chime} pressed={f.chime} onClick={() => setF({ chime: !f.chime })}><Bell size={16} aria-hidden="true" /></IconButton>
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
