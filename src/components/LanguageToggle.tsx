import { useApp, useT } from '../state/AppContext'

export function LanguageToggle() {
  const { state, dispatch } = useApp()
  const t = useT()
  return (
    <div role="group" aria-label={t.language} className="glass-btn inline-flex p-0.5 text-sm font-medium">
      {(['en', 'ru'] as const).map((lang) => (
        <button key={lang} aria-pressed={state.lang === lang} lang={lang}
          onClick={() => dispatch({ type: 'SET_LANG', lang })}
          className="rounded-full px-3 py-1 transition-colors"
          style={state.lang === lang ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : undefined}>
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
