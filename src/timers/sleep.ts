export const FADE_SECONDS = 30
export const EXTEND_MIN = 15
export const MAX_SLEEP_MS = 12 * 60 * 60_000

export interface SleepRun {
  status: 'idle' | 'running' | 'fading'
  endTime: number | null
}

export const IDLE_SLEEP: SleepRun = { status: 'idle', endTime: null }

export function startSleep(minutes: number, now: number): SleepRun {
  return { status: 'running', endTime: now + minutes * 60_000 }
}

export function extendSleep(run: SleepRun, now: number): SleepRun {
  if (run.status !== 'running' || run.endTime === null) return run
  return { ...run, endTime: Math.min(run.endTime + EXTEND_MIN * 60_000, now + MAX_SLEEP_MS) }
}

/** `due` is true exactly once: when the countdown hits zero and the fade should begin. */
export function tickSleep(run: SleepRun, now: number): { run: SleepRun; due: boolean } {
  if (run.status === 'running' && run.endTime !== null && now >= run.endTime) {
    return { run: { status: 'fading', endTime: run.endTime }, due: true }
  }
  return { run, due: false }
}
