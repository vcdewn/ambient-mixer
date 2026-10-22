import type { SoundId } from '../data/sounds'

export type Lang = 'ru' | 'en'
export type BgPreset = 'night' | 'sunset' | 'moss'
export type TimerMode = 'off' | 'focus' | 'sleep'

export interface TrackState {
  enabled: boolean
  volume: number
}

export interface FocusSettings {
  workMin: number
  breakMin: number
  longBreakMin: number
  cyclesBeforeLong: number
  autoAdvance: boolean
  chime: boolean
}

export interface AppState {
  /** True after the user pressed “Start session” */
  started: boolean
  tracks: Record<SoundId, TrackState>
  masterPlaying: boolean
  masterVolume: number
  bgPreset: BgPreset
  lang: Lang
  timerMode: TimerMode
  focus: FocusSettings
  sleepMinutes: number
}

export type Action =
  | { type: 'START' }
  | { type: 'TOGGLE_TRACK'; id: SoundId }
  | { type: 'SET_VOLUME'; id: SoundId; volume: number }
  | { type: 'SET_MASTER_PLAYING'; playing: boolean }
  | { type: 'SET_MASTER_VOLUME'; volume: number }
  | { type: 'SET_BG'; preset: BgPreset }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'SET_TIMER_MODE'; mode: TimerMode }
  | { type: 'SET_FOCUS'; patch: Partial<FocusSettings> }
  | { type: 'SET_SLEEP_MINUTES'; minutes: number }
