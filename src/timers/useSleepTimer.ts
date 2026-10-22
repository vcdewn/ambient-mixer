import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioEngine } from '../audio/engine'
import { FADE_SECONDS, IDLE_SLEEP, extendSleep, startSleep, tickSleep, type SleepRun } from './sleep'

export function useSleepTimer(engine: AudioEngine, onFaded: () => void) {
  const [run, setRun] = useState<SleepRun>(IDLE_SLEEP)
  const [now, setNow] = useState(() => Date.now())
  const runRef = useRef(run)
  const fadeTimer = useRef<number>(undefined)
  const fadedRef = useRef(onFaded)
  fadedRef.current = onFaded

  const commit = useCallback((next: SleepRun) => {
    runRef.current = next
    setRun(next)
    setNow(Date.now())
  }, [])

  useEffect(() => {
    if (run.status !== 'running') return
    const id = window.setInterval(() => {
      const t = Date.now()
      const res = tickSleep(runRef.current, t)
      if (res.due) {
        commit(res.run)
        engine.fadeOut(FADE_SECONDS)
        fadeTimer.current = window.setTimeout(() => {
          fadedRef.current()
          commit(IDLE_SLEEP)
        }, FADE_SECONDS * 1000)
      } else {
        setNow(t)
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [run.status, engine, commit])

  const cancel = useCallback(() => {
    if (runRef.current.status === 'fading') {
      window.clearTimeout(fadeTimer.current)
      engine.setPlaying(true)
    }
    if (runRef.current.status !== 'idle') commit(IDLE_SLEEP)
  }, [engine, commit])

  return {
    run,
    left: run.endTime ? Math.max(0, run.endTime - now) : 0,
    start: (minutes: number) => commit(startSleep(minutes, Date.now())),
    extend: () => commit(extendSleep(runRef.current, Date.now())),
    cancel,
  }
}
