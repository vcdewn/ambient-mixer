import { SOUNDS } from '../data/sounds'
import { useT } from '../state/AppContext'

export function Credits() {
  const t = useT()
  return (
    <details className="text-sm" style={{ color: 'var(--fg-soft)' }}>
      <summary className="cursor-pointer select-none">{t.credits}</summary>
      <ul className="mt-2 space-y-1">
        {SOUNDS.map((s) => (
          <li key={s.id}>
            <strong>{t.sounds[s.id]}</strong>: {s.credit.title} — {s.credit.author} ({s.credit.license})
            {s.credit.url && (<> · <a className="underline" href={s.credit.url} target="_blank" rel="noopener noreferrer">link</a></>)}
          </li>
        ))}
      </ul>
      <p className="mt-2">{t.creditsHint}</p>
    </details>
  )
}
