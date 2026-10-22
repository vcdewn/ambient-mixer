import { SOUND_IDS } from '../data/sounds'
import { clamp, createInitialState, sanitizeFocus } from './reducer'
import type { AppState, BgPreset, FocusSettings, Lang, TimerMode } from './types'

export const STORAGE_KEY = 'ambient-mixer:v1'

const BG: BgPreset[] = ['night', 'sunset', 'misty']
const LANGS: Lang[] = ['ru', 'en']
const MODES: TimerMode[] = ['off', 'focus', 'sleep']

type Persisted = Pick<
  AppState,
  'masterVolume' | 'bgPreset' | 'lang' | 'timerMode' | 'focus' | 'sleepMinutes'
> & { volumes: Record<string, number> }

export function toPersisted(state: AppState): Persisted {
  return {
    masterVolume: state.masterVolume,
    bgPreset: state.bgPreset,
    lang: state.lang,
    timerMode: state.timerMode,
    focus: state.focus,
    sleepMinutes: state.sleepMinutes,
    volumes: Object.fromEntries(SOUND_IDS.map((id) => [id, state.tracks[id].volume])),
  }
}

/** Merges whatever is in storage onto defaults, ignoring anything invalid. */
export function mergePersisted(raw: unknown): AppState {
  const base = createInitialState()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Record<string, unknown>
  const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback)

  const next: AppState = { ...base }
  next.masterVolume = clamp(num(r.masterVolume, base.masterVolume), 0, 1)
  if (BG.includes(r.bgPreset as BgPreset)) next.bgPreset = r.bgPreset as BgPreset
  if (LANGS.includes(r.lang as Lang)) next.lang = r.lang as Lang
  if (MODES.includes(r.timerMode as TimerMode)) next.timerMode = r.timerMode as TimerMode
  next.sleepMinutes = Math.round(clamp(num(r.sleepMinutes, base.sleepMinutes), 1, 720))

  if (r.focus && typeof r.focus === 'object') {
    const f = r.focus as Record<string, unknown>
    next.focus = sanitizeFocus({
      workMin: num(f.workMin, base.focus.workMin),
      breakMin: num(f.breakMin, base.focus.breakMin),
      longBreakMin: num(f.longBreakMin, base.focus.longBreakMin),
      cyclesBeforeLong: num(f.cyclesBeforeLong, base.focus.cyclesBeforeLong),
      autoAdvance: typeof f.autoAdvance === 'boolean' ? f.autoAdvance : base.focus.autoAdvance,
      chime: typeof f.chime === 'boolean' ? f.chime : base.focus.chime,
    } satisfies FocusSettings)
  }

  if (r.volumes && typeof r.volumes === 'object') {
    const v = r.volumes as Record<string, unknown>
    next.tracks = { ...base.tracks }
    for (const id of SOUND_IDS) {
      // only volumes come back; every session starts silent
      next.tracks[id] = { enabled: false, volume: clamp(num(v[id], 0.5), 0, 1) }
    }
  }
  return next
}

export function loadState(): AppState {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    return mergePersisted(text ? JSON.parse(text) : null)
  } catch {
    return createInitialState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(state)))
  } catch {
    /* storage unavailable (private mode / quota) — the app still works */
  }
}
