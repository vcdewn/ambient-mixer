import { describe, expect, it } from 'vitest'
import { createInitialState, reducer } from '../state/reducer'
import { mergePersisted, toPersisted } from '../state/storage'

describe('reducer', () => {
  it('starts with every track off at 50%', () => {
    const s = createInitialState()
    expect(Object.values(s.tracks).every((t) => !t.enabled && t.volume === 0.5)).toBe(true)
  })

  it('toggling a track on un-pauses the master', () => {
    let s = reducer(createInitialState(), { type: 'SET_MASTER_PLAYING', playing: false })
    s = reducer(s, { type: 'TOGGLE_TRACK', id: 'rain' })
    expect(s.tracks.rain.enabled).toBe(true)
    expect(s.masterPlaying).toBe(true)
  })

  it('clamps volume and settings', () => {
    let s = reducer(createInitialState(), { type: 'SET_VOLUME', id: 'rain', volume: 7 })
    expect(s.tracks.rain.volume).toBe(1)
    s = reducer(s, { type: 'SET_FOCUS', patch: { workMin: 9999, breakMin: -3 } })
    expect(s.focus.workMin).toBe(120)
    expect(s.focus.breakMin).toBe(1)
    s = reducer(s, { type: 'SET_SLEEP_MINUTES', minutes: 100000 })
    expect(s.sleepMinutes).toBe(720)
  })
})

describe('persistence', () => {
  it('restores volumes but not enabled flags', () => {
    let s = reducer(createInitialState(), { type: 'TOGGLE_TRACK', id: 'rain' })
    s = reducer(s, { type: 'SET_VOLUME', id: 'rain', volume: 0.2 })
    const restored = mergePersisted(JSON.parse(JSON.stringify(toPersisted(s))))
    expect(restored.tracks.rain).toEqual({ enabled: false, volume: 0.2 })
  })

  it('falls back to defaults for garbage', () => {
    const base = createInitialState()
    expect(mergePersisted('nope').masterVolume).toBe(base.masterVolume)
    const bad = mergePersisted({ masterVolume: 'x', bgPreset: 'neon', focus: { workMin: 'a' }, volumes: { rain: 99 } })
    expect(bad.bgPreset).toBe('night')
    expect(bad.focus.workMin).toBe(25)
    expect(bad.tracks.rain.volume).toBe(1)
  })
})
