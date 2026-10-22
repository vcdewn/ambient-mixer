import { describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../audio/engine'
import { SOUNDS } from '../data/sounds'

function param(initial = 0) {
  return {
    value: initial,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
}
function node() {
  return { gain: param(), connect: vi.fn() }
}

function fakeContext() {
  const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; loop: boolean; connect: ReturnType<typeof vi.fn> }[] = []
  const ctx = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    resume: vi.fn(async () => { ctx.state = 'running' }),
    createGain: vi.fn(node),
    createBufferSource: vi.fn(() => {
      const s = { start: vi.fn(), stop: vi.fn(), loop: false, buffer: null, connect: vi.fn() }
      sources.push(s)
      return s
    }),
    decodeAudioData: vi.fn(async () => ({}) as AudioBuffer),
    close: vi.fn(),
  }
  return { ctx, sources }
}

const okFetch = (async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) as unknown as typeof fetch

describe('AudioEngine', () => {
  it('creates and resumes the context on init and loads every file', async () => {
    const { ctx } = fakeContext()
    const engine = new AudioEngine(SOUNDS, '/', () => ctx as unknown as AudioContext, okFetch)
    engine.init()
    expect(ctx.resume).toHaveBeenCalled()
    await engine.loadAll()
    expect(Object.values(engine.getSnapshot()).every((s) => s === 'ready')).toBe(true)
  })

  it('plays an enabled track as a loop and stops it when disabled', async () => {
    const { ctx, sources } = fakeContext()
    const engine = new AudioEngine(SOUNDS, '/', () => ctx as unknown as AudioContext, okFetch)
    engine.init()
    engine.setTrack('rain', true, 0.7) // requested before loading finishes
    await engine.loadAll()
    expect(sources).toHaveLength(1)
    expect(sources[0].loop).toBe(true)
    expect(sources[0].start).toHaveBeenCalled()
    engine.setTrack('rain', false, 0.7)
    expect(sources[0].stop).toHaveBeenCalled()
  })

  it('routes output through a playing <audio> element so it survives screen lock', async () => {
    const { ctx } = fakeContext()
    const dest = { stream: {} }
    const createDest = vi.fn(() => dest)
    Object.assign(ctx, { createMediaStreamDestination: createDest })
    const play = vi.fn(async () => {})
    vi.stubGlobal('Audio', class { srcObject: unknown; paused = false; play = play; pause = vi.fn(); setAttribute = vi.fn() })
    const engine = new AudioEngine(SOUNDS, '/', () => ctx as unknown as AudioContext, okFetch)
    engine.init()
    await Promise.resolve()
    await Promise.resolve()
    expect(createDest).toHaveBeenCalled()
    expect(play).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('stays on direct output when the browser refuses to play the element', async () => {
    const { ctx } = fakeContext()
    Object.assign(ctx, { createMediaStreamDestination: vi.fn(() => ({ stream: {} })) })
    vi.stubGlobal('Audio', class { play = vi.fn(async () => { throw new Error('NotAllowedError') }); pause = vi.fn(); setAttribute = vi.fn() })
    const engine = new AudioEngine(SOUNDS, '/', () => ctx as unknown as AudioContext, okFetch)
    expect(() => engine.init()).not.toThrow()
    await Promise.resolve()
    await Promise.resolve()
    vi.unstubAllGlobals()
  })

  it('marks a failed file as error and recovers on retry', async () => {
    const { ctx } = fakeContext()
    let fail = true
    const fetcher = (async () => (fail ? { ok: false, status: 404 } : { ok: true, arrayBuffer: async () => new ArrayBuffer(1) })) as unknown as typeof fetch
    const engine = new AudioEngine(SOUNDS, '/', () => ctx as unknown as AudioContext, fetcher)
    engine.init()
    await engine.load('rain')
    expect(engine.getSnapshot().rain).toBe('error')
    fail = false
    await engine.retry('rain')
    expect(engine.getSnapshot().rain).toBe('ready')
  })
})
