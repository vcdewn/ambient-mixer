import { Moon } from 'lucide-react'
import { useEngine } from '../audio/EngineContext'
import { AudioEngine } from '../audio/engine'
import { useApp, useT } from '../state/AppContext'
import { LanguageToggle } from './LanguageToggle'

export function StartScreen() {
  const { state, dispatch } = useApp()
  const { engine } = useEngine()
  const t = useT()
  const supported = AudioEngine.isSupported()

  const start = () => {
    // the AudioContext must be created inside this click to get past autoplay blocking
    engine.init()
    dispatch({ type: 'START' })
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-6 text-center
      backdrop-blur-2xl transition-opacity duration-700 ${state.started ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgb(10 8 30 / 0.35)' }} aria-hidden={state.started}>
      <div className="absolute right-4 top-4"><LanguageToggle /></div>
      <Moon size={56} aria-hidden="true" style={{ color: 'var(--accent)' }} />
      <div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{t.appName}</h1>
        <p className="mt-3 text-lg" style={{ color: 'var(--fg-soft)' }}>{t.tagline}</p>
      </div>
      {supported ? (
        <>
          <button className="btn-primary px-10 py-4 text-lg" onClick={start} tabIndex={state.started ? -1 : 0} autoFocus>
            {t.startSession}
          </button>
          <p className="text-sm" style={{ color: 'var(--fg-soft)' }}>{t.startHint}</p>
        </>
      ) : (
        <p className="max-w-sm">{t.noWebAudio}</p>
      )}
    </div>
  )
}
