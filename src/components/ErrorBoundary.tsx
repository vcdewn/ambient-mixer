import { Component, type ReactNode } from 'react'
import { DICTS } from '../i18n'
import { loadState } from '../state/storage'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    // outside the provider tree, so read the language straight from storage
    const t = DICTS[loadState().lang]
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">{t.errorTitle}</h1>
        <button className="btn-primary px-6 py-3" onClick={() => window.location.reload()}>{t.reload}</button>
      </div>
    )
  }
}
