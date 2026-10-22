import type { SoundDef, SoundId } from '../data/sounds'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type ChimeKind = 'work' | 'break'

interface Track {
  def: SoundDef
  status: LoadStatus
  buffer: AudioBuffer | null
  gain: GainNode | null
  source: AudioBufferSourceNode | null
  enabled: boolean
  volume: number
}

const TRACK_FADE = 0.6
const SMOOTH = 0.05

/**
 * Web Audio graph:
 *   source(loop) → track gain ─┐
 *   ...                         ├→ master gain → pause gate → out ─┐
 *   chime osc → chime gain ─────────────────────────────────→ out ─┴→ destination
 *                                                                  └→ <audio> element
 *
 * Pausing mutes the gate instead of suspending the context, so the timer chime
 * can still ring while the mix is paused.
 *
 * Mobile browsers freeze a bare AudioContext when the screen locks. Routing `out`
 * through a MediaStream into a playing <audio> element (plus Media Session metadata)
 * makes the page count as a media player, so the mix keeps playing in the background.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private gate: GainNode | null = null
  private out: GainNode | null = null
  private keepAlive: HTMLAudioElement | null = null
  private tracks = new Map<SoundId, Track>()
  private masterVolume = 0.8
  private playing = true
  private listeners = new Set<() => void>()
  private snapshot: Record<string, LoadStatus> = {}

  constructor(
    sounds: SoundDef[],
    private readonly baseUrl: string,
    private readonly createContext: () => AudioContext = () => new AudioContext(),
    private readonly fetcher: typeof fetch = (...a) => fetch(...a),
  ) {
    for (const def of sounds) {
      this.tracks.set(def.id, {
        def, status: 'idle', buffer: null, gain: null, source: null, enabled: false, volume: 0.5,
      })
    }
    this.updateSnapshot()
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext)
  }

  // ---- status store (for useSyncExternalStore) ----
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  getSnapshot = (): Record<string, LoadStatus> => this.snapshot
  private updateSnapshot() {
    const next: Record<string, LoadStatus> = {}
    for (const [id, t] of this.tracks) next[id] = t.status
    this.snapshot = next
    this.listeners.forEach((l) => l())
  }

  // ---- lifecycle ----
  /** Must be called synchronously from a user gesture (the “Start session” click). */
  init(): void {
    if (this.ctx) {
      void this.resumeIfNeeded()
      return
    }
    const ctx = this.createContext()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.gate = ctx.createGain()
    this.master.gain.value = this.masterVolume
    this.gate.gain.value = this.playing ? 1 : 0
    this.out = ctx.createGain()
    this.master.connect(this.gate)
    this.gate.connect(this.out)
    this.out.connect(ctx.destination)
    for (const t of this.tracks.values()) {
      t.gain = ctx.createGain()
      t.gain.gain.value = 0
      t.gain.connect(this.master)
    }
    void ctx.resume()
    void this.routeThroughMediaElement()
    this.updateMediaSession()
  }

  /** Falls back to direct output if the browser refuses (or lacks MediaStream destinations). */
  private async routeThroughMediaElement(): Promise<void> {
    const ctx = this.ctx
    if (!ctx || !this.out || typeof ctx.createMediaStreamDestination !== 'function' || typeof Audio === 'undefined') return
    try {
      const dest = ctx.createMediaStreamDestination()
      const el = new Audio()
      el.srcObject = dest.stream
      el.setAttribute('playsinline', '')
      await el.play() // called synchronously from the “Start” click, so it counts as a user gesture
      this.out.connect(dest)
      this.out.disconnect(ctx.destination)
      this.keepAlive = el
    } catch {
      /* stay on direct output */
    }
  }

  async resumeIfNeeded(): Promise<void> {
    if (this.keepAlive?.paused) void this.keepAlive.play().catch(() => {})
    if (this.ctx && this.ctx.state !== 'running') {
      try { await this.ctx.resume() } catch { /* needs a gesture; retried on next tap */ }
    }
  }

  /** Lock-screen / notification controls. `play` / `pause` mirror the master button. */
  setMediaHandlers(meta: { title: string; artist: string }, handlers: { play: () => void; pause: () => void }): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    try {
      ms.metadata = new MediaMetadata({ title: meta.title, artist: meta.artist })
      ms.setActionHandler('play', handlers.play)
      ms.setActionHandler('pause', handlers.pause)
    } catch {
      /* unsupported action — controls are a nicety */
    }
    this.updateMediaSession()
  }

  private updateMediaSession(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = this.playing ? 'playing' : 'paused'
  }

  get state(): AudioContextState | 'none' {
    return this.ctx?.state ?? 'none'
  }

  loadAll(): Promise<void[]> {
    return Promise.all([...this.tracks.keys()].map((id) => this.load(id)))
  }

  async load(id: SoundId): Promise<void> {
    const t = this.tracks.get(id)
    if (!t || !this.ctx || t.status === 'loading' || t.status === 'ready') return
    t.status = 'loading'
    this.updateSnapshot()
    try {
      const res = await this.fetcher(this.baseUrl + t.def.file)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.arrayBuffer()
      t.buffer = await this.ctx.decodeAudioData(data)
      t.status = 'ready'
    } catch {
      t.status = 'error'
    }
    this.updateSnapshot()
    this.apply(t)
  }

  retry(id: SoundId): Promise<void> {
    const t = this.tracks.get(id)
    if (t?.status === 'error') t.status = 'idle'
    return this.load(id)
  }

  // ---- control ----
  setTrack(id: SoundId, enabled: boolean, volume: number): void {
    const t = this.tracks.get(id)
    if (!t) return
    t.enabled = enabled
    t.volume = volume
    this.apply(t)
  }

  private apply(t: Track): void {
    const ctx = this.ctx
    if (!ctx || !t.gain || t.status !== 'ready' || !t.buffer) return
    const now = ctx.currentTime
    if (t.enabled) {
      if (!t.source) {
        const src = ctx.createBufferSource()
        src.buffer = t.buffer
        src.loop = true
        src.connect(t.gain)
        src.start()
        t.source = src
        t.gain.gain.cancelScheduledValues(now)
        t.gain.gain.setValueAtTime(0, now)
        t.gain.gain.linearRampToValueAtTime(t.volume, now + TRACK_FADE)
      } else {
        t.gain.gain.setTargetAtTime(t.volume, now, SMOOTH)
      }
    } else if (t.source) {
      const src = t.source
      t.source = null
      t.gain.gain.cancelScheduledValues(now)
      t.gain.gain.setValueAtTime(t.gain.gain.value, now)
      t.gain.gain.linearRampToValueAtTime(0, now + TRACK_FADE)
      src.stop(now + TRACK_FADE + 0.05)
    }
  }

  setMasterVolume(v: number): void {
    this.masterVolume = v
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, SMOOTH)
  }

  setPlaying(playing: boolean, fadeSeconds = 0.4): void {
    this.playing = playing
    this.updateMediaSession()
    if (!this.ctx || !this.gate) return
    const now = this.ctx.currentTime
    this.gate.gain.cancelScheduledValues(now)
    this.gate.gain.setValueAtTime(this.gate.gain.value, now)
    this.gate.gain.linearRampToValueAtTime(playing ? 1 : 0, now + fadeSeconds)
    if (playing) void this.resumeIfNeeded()
  }

  /** Slowly mutes the whole mix (sleep timer). The caller pauses the state afterwards. */
  fadeOut(seconds: number): void {
    this.setPlaying(false, seconds)
  }

  /** Soft two-note bell, played outside the master chain so a paused mix doesn't silence it. */
  playChime(kind: ChimeKind): void {
    const ctx = this.ctx
    if (!ctx) return
    void this.resumeIfNeeded()
    const notes = kind === 'break' ? [659.25, 523.25] : [523.25, 659.25]
    const t0 = ctx.currentTime + 0.02
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = t0 + i * 0.35
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(0.18, start + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.8)
      osc.connect(g)
      g.connect(this.out ?? ctx.destination)
      osc.start(start)
      osc.stop(start + 1.9)
    })
  }

  dispose(): void {
    for (const t of this.tracks.values()) {
      try { t.source?.stop() } catch { /* already stopped */ }
      t.source = null
    }
    if (this.keepAlive) {
      this.keepAlive.pause()
      this.keepAlive.srcObject = null
      this.keepAlive = null
    }
    void this.ctx?.close()
    this.ctx = null
  }
}
