import type { FocusSettings } from '../state/types'

export type Phase = 'work' | 'break' | 'longBreak'

export interface FocusRun {
  phase: Phase
  status: 'idle' | 'running' | 'paused'
  /** Absolute finish time while running */
  endTime: number | null
  /** Time left while idle / paused */
  remainingMs: number
  /** Finished work sessions in the current cycle (0..cyclesBeforeLong) */
  cycle: number
}

export function phaseMs(phase: Phase, s: FocusSettings): number {
  const min = phase === 'work' ? s.workMin : phase === 'break' ? s.breakMin : s.longBreakMin
  return min * 60_000
}

export function initFocus(s: FocusSettings): FocusRun {
  return { phase: 'work', status: 'idle', endTime: null, remainingMs: phaseMs('work', s), cycle: 0 }
}

export function remaining(run: FocusRun, now: number): number {
  return run.status === 'running' && run.endTime !== null
    ? Math.max(0, run.endTime - now)
    : run.remainingMs
}

export function start(run: FocusRun, now: number): FocusRun {
  if (run.status === 'running') return run
  return { ...run, status: 'running', endTime: now + run.remainingMs }
}

export function pause(run: FocusRun, now: number): FocusRun {
  if (run.status !== 'running') return run
  return { ...run, status: 'paused', endTime: null, remainingMs: remaining(run, now) }
}

/** Moves to the following phase. `completed` = the current phase ran to its end (vs. skipped). */
export function advance(
  run: FocusRun,
  s: FocusSettings,
  now: number,
  completed: boolean,
  keepRunning: boolean,
): FocusRun {
  let phase: Phase
  let cycle = run.cycle
  if (run.phase === 'work') {
    if (completed) cycle += 1
    phase = completed && cycle >= s.cyclesBeforeLong ? 'longBreak' : 'break'
  } else {
    phase = 'work'
    if (run.phase === 'longBreak') cycle = 0
  }
  const ms = phaseMs(phase, s)
  return keepRunning
    ? { phase, status: 'running', endTime: now + ms, remainingMs: ms, cycle }
    : { phase, status: 'idle', endTime: null, remainingMs: ms, cycle }
}

/** Manual “skip”: never counts as a finished pomodoro. */
export function skip(run: FocusRun, s: FocusSettings, now: number): FocusRun {
  return advance(run, s, now, false, run.status === 'running')
}

export interface TickResult {
  run: FocusRun
  /** Set when a phase just ended */
  finished: Phase | null
}

export function tick(run: FocusRun, s: FocusSettings, now: number): TickResult {
  if (run.status !== 'running' || run.endTime === null || now < run.endTime) {
    return { run, finished: null }
  }
  return { run: advance(run, s, now, true, s.autoAdvance), finished: run.phase }
}

/** Keeps an untouched timer in sync with edited durations. */
export function applySettings(run: FocusRun, s: FocusSettings): FocusRun {
  if (run.status !== 'idle') return run
  return { ...run, remainingMs: phaseMs(run.phase, s) }
}
