import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { SOUNDS, SOUND_IDS } from '../data/sounds'
import { DICTS } from '../i18n'
import { useApp } from '../state/AppContext'
import { AudioEngine, type LoadStatus } from './engine'

interface EngineCtx {
  engine: AudioEngine
  statuses: Record<string, LoadStatus>
}

const Ctx = createContext<EngineCtx | null>(null)

export function EngineProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const ref = useRef<AudioEngine>(undefined)
  ref.current ??= new AudioEngine(SOUNDS, import.meta.env.BASE_URL)
  const engine = ref.current
  const statuses = useSyncExternalStore(engine.subscribe, engine.getSnapshot)

  // engine itself is created by the “Start” click (see StartScreen) — here we only mirror state into it
  useEffect(() => {
    if (!state.started) return
    void engine.loadAll()
  }, [state.started, engine])

  useEffect(() => {
    for (const id of SOUND_IDS) engine.setTrack(id, state.tracks[id].enabled, state.tracks[id].volume)
  }, [engine, state.tracks])

  useEffect(() => engine.setMasterVolume(state.masterVolume), [engine, state.masterVolume])
  useEffect(() => engine.setPlaying(state.masterPlaying), [engine, state.masterPlaying])

  // lock-screen / notification play-pause buttons drive the master button
  const t = DICTS[state.lang]
  const { dispatch } = useApp()
  useEffect(() => {
    if (!state.started) return
    engine.setMediaHandlers(
      { title: t.appName, artist: t.tagline },
      {
        play: () => dispatch({ type: 'SET_MASTER_PLAYING', playing: true }),
        pause: () => dispatch({ type: 'SET_MASTER_PLAYING', playing: false }),
      },
    )
  }, [state.started, engine, dispatch, t.appName, t.tagline])

  // iOS may leave the context “interrupted” after a call — resume on the next touch
  useEffect(() => {
    if (!state.started) return
    const resume = () => void engine.resumeIfNeeded()
    window.addEventListener('pointerdown', resume)
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.removeEventListener('pointerdown', resume)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [state.started, engine])

  return <Ctx.Provider value={{ engine, statuses }}>{children}</Ctx.Provider>
}

export function useEngine(): EngineCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEngine must be used inside EngineProvider')
  return ctx
}
