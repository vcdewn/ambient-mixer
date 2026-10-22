import { SOUND_IDS, type SoundId } from '../data/sounds'
import type { Action, AppState, FocusSettings } from './types'

export const LIMITS = {
  focusMin: 1,
  focusMax: 120,
  cyclesMin: 1,
  cyclesMax: 12,
  sleepMin: 1,
  sleepMax: 12 * 60,
} as const

export const DEFAULT_FOCUS: FocusSettings = {
  workMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLong: 4,
  autoAdvance: true,
  chime: true,
}

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export function defaultLang(): 'ru' | 'en' {
  try {
    return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
  } catch {
    return 'en'
  }
}

export function createInitialState(): AppState {
  const tracks = Object.fromEntries(
    SOUND_IDS.map((id) => [id, { enabled: false, volume: 0.5 }]),
  ) as AppState['tracks']
  return {
    started: false,
    tracks,
    masterPlaying: true,
    masterVolume: 0.8,
    bgPreset: 'night',
    lang: defaultLang(),
    timerMode: 'off',
    focus: { ...DEFAULT_FOCUS },
    sleepMinutes: 120,
  }
}

export function sanitizeFocus(f: FocusSettings): FocusSettings {
  return {
    workMin: Math.round(clamp(f.workMin, LIMITS.focusMin, LIMITS.focusMax)),
    breakMin: Math.round(clamp(f.breakMin, LIMITS.focusMin, LIMITS.focusMax)),
    longBreakMin: Math.round(clamp(f.longBreakMin, LIMITS.focusMin, LIMITS.focusMax)),
    cyclesBeforeLong: Math.round(clamp(f.cyclesBeforeLong, LIMITS.cyclesMin, LIMITS.cyclesMax)),
    autoAdvance: !!f.autoAdvance,
    chime: !!f.chime,
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START':
      return { ...state, started: true, masterPlaying: true }
    case 'TOGGLE_TRACK': {
      const t = state.tracks[action.id]
      const enabled = !t.enabled
      return {
        ...state,
        // turning something on while paused should be audible
        masterPlaying: enabled ? true : state.masterPlaying,
        tracks: { ...state.tracks, [action.id]: { ...t, enabled } },
      }
    }
    case 'SET_VOLUME':
      return {
        ...state,
        tracks: {
          ...state.tracks,
          [action.id as SoundId]: {
            ...state.tracks[action.id],
            volume: clamp(action.volume, 0, 1),
          },
        },
      }
    case 'SET_MASTER_PLAYING':
      return { ...state, masterPlaying: action.playing }
    case 'SET_MASTER_VOLUME':
      return { ...state, masterVolume: clamp(action.volume, 0, 1) }
    case 'SET_BG':
      return { ...state, bgPreset: action.preset }
    case 'SET_LANG':
      return { ...state, lang: action.lang }
    case 'SET_TIMER_MODE':
      return { ...state, timerMode: action.mode }
    case 'SET_FOCUS':
      return { ...state, focus: sanitizeFocus({ ...state.focus, ...action.patch }) }
    case 'SET_SLEEP_MINUTES':
      return {
        ...state,
        sleepMinutes: Math.round(clamp(action.minutes, LIMITS.sleepMin, LIMITS.sleepMax)),
      }
  }
}
