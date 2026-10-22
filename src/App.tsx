import { useEffect } from 'react'
import { EngineProvider } from './audio/EngineContext'
import { Background } from './components/Background'
import { BackgroundPresets } from './components/BackgroundPresets'
import { Credits } from './components/Credits'
import { LanguageToggle } from './components/LanguageToggle'
import { MasterControl } from './components/MasterControl'
import { SoundCard } from './components/SoundCard'
import { StartScreen } from './components/StartScreen'
import { TimerPanel } from './components/TimerPanel'
import { SOUNDS } from './data/sounds'
import { AppProvider, useApp, useT } from './state/AppContext'

function Mixer() {
  const { state } = useApp()
  const t = useT()

  return (
    <>
      <Background />
      <main data-bg={state.bgPreset} className="mx-auto flex min-h-screen max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6"
        aria-hidden={!state.started} inert={!state.started}>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t.appName}</h1>
          <div className="flex items-center gap-4">
            <BackgroundPresets />
            <LanguageToggle />
          </div>
        </header>

        <MasterControl />
        <TimerPanel />

        <section className="grid gap-4 sm:grid-cols-2">
          {SOUNDS.map((s) => <SoundCard key={s.id} sound={s} />)}
        </section>

        <footer className="mt-auto pt-4"><Credits /></footer>
      </main>
      <StartScreen />
    </>
  )
}

/** Keeps the data-bg attribute on <html> in sync so every surface (including the start screen) picks up theme variables. */
function ThemeSync() {
  const { state } = useApp()
  useEffect(() => {
    document.documentElement.dataset.bg = state.bgPreset
    document.documentElement.lang = state.lang
  }, [state.bgPreset, state.lang])
  return null
}

export default function App() {
  return (
    <AppProvider>
      <ThemeSync />
      <EngineProvider>
        <Mixer />
      </EngineProvider>
    </AppProvider>
  )
}
