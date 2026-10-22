import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from 'react'
import { DICTS, type Dict } from '../i18n'
import { reducer } from './reducer'
import { loadState, saveState } from './storage'
import type { Action, AppState } from './types'

interface Ctx {
  state: AppState
  dispatch: Dispatch<Action>
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // debounced persistence
  const timer = useRef<number>(undefined)
  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => saveState(state), 300)
    return () => window.clearTimeout(timer.current)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function useT(): Dict {
  return DICTS[useApp().state.lang]
}
