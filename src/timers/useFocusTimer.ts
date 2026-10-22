import { useCallback, useEffect, useRef, useState } from 'react'
import type { FocusSettings } from '../state/types'
import { applySettings, initFocus, pause, remaining, skip, start, tick, type FocusRun, type Phase } from './focus'

export function useFocusTimer(settings: FocusSettings, onFinished: (finished: Phase, next: Phase) => void) {
  const [run, setRun] = useState<FocusRun>(() => initFocus(settings))
  const [now, setNow] = useState(() => Date.now())
  const runRef = useRef(run)
  const settingsRef = useRef(settings)
  const finishedRef = useRef(onFinished)
  settingsRef.current = settings
  finishedRef.current = onFinished

  const commit = useCallback((next: FocusRun) => {
    runRef.current = next
    setRun(next)
    setNow(Date.now())
  }, [])

  useEffect(() => {
    commit(applySettings(runRef.current, settings))
  }, [settings, commit])

  useEffect(() => {
    if (run.status !== 'running') return
    const id = window.setInterval(() => {
      const t = Date.now()
      const res = tick(runRef.current, settingsRef.current, t)
      if (res.finished) {
        commit(res.run)
        finishedRef.current(res.finished, res.run.phase)
      } else {
        setNow(t)
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [run.status, run.phase, commit])

  return {
    run,
    left: remaining(run, now),
    start: () => commit(start(runRef.current, Date.now())),
    pause: () => commit(pause(runRef.current, Date.now())),
    skip: () => commit(skip(runRef.current, settingsRef.current, Date.now())),
    reset: useCallback(() => commit(initFocus(settingsRef.current)), [commit]),
  }
}
