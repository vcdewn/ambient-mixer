// Seamless procedural loops: cozy window rain and a blizzard heard from inside a warm house.
import fs from 'fs'

const SR = 48000
const DUR = 60
const N = SR * DUR
const TAU = Math.PI * 2

let seed = 1
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += rnd(); return (s - 3) / 0.7071 }
const noise = () => Float32Array.from({ length: N }, () => rnd() * 2 - 1)

// state-variable filter; returns lp / bp (unity peak) / hp, run twice around the loop so it wraps seamlessly
function svf(x, fcOf, q, mode) {
  const out = new Float32Array(N)
  let ic1 = 0, ic2 = 0
  const R = 1 / (2 * q)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < N; i++) {
      const g = Math.tan(Math.PI * Math.min(fcOf(i), SR * 0.45) / SR)
      const h = 1 / (1 + 2 * R * g + g * g)
      const hp = (x[i] - (2 * R + g) * ic1 - ic2) * h
      const bp = g * hp + ic1
      const lp = g * bp + ic2
      ic1 = g * hp + bp
      ic2 = g * bp + lp
      if (pass === 1) out[i] = mode === 'lp' ? lp : mode === 'hp' ? hp : 2 * R * bp
    }
  }
  return out
}
const lp = (x, fc, q = 0.707) => svf(x, () => fc, q, 'lp')
const hp = (x, fc, q = 0.707) => svf(x, () => fc, q, 'hp')

// periodic LFO: an integer number of cycles per loop, so the end meets the start
const lfo = (cycles, phase) => (i) => Math.sin(TAU * (cycles * i / N + phase))
const smooth = (x) => x * x * (3 - 2 * x)

function normalize(ch, rmsDb, peak = 0.9) {
  let s = 0, c = 0
  for (const a of ch) for (let i = 0; i < N; i++) { s += a[i] * a[i]; c++ }
  const k = Math.pow(10, rmsDb / 20) / Math.sqrt(s / c)
  for (const a of ch) for (let i = 0; i < N; i++) a[i] = Math.tanh(a[i] * k / peak) * peak
}

function writeWav(path, ch) {
  const n = ch.length, buf = Buffer.alloc(44 + N * n * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * n * 2, 4); buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(n, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * n * 2, 28); buf.writeUInt16LE(n * 2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(N * n * 2, 40)
  for (let i = 0; i < N; i++) for (let c = 0; c < n; c++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, ch[c][i])) * 32767), 44 + (i * n + c) * 2)
  fs.writeFileSync(path, buf)
}

// ---------- Blizzard: a warm room, wind howling outside ----------
function blizzard() {
  seed = 11
  const ch = [0, 1].map((side) => {
    // slow gusts (all periods divide the loop), shared character, per-channel phase
    const gustCycles = [3, 5, 8]
    const gust = (i) => {
      const a = 0.5 + 0.5 * lfo(gustCycles[0], 0.1 + side * 0.07)(i)
      const b = 0.5 + 0.5 * lfo(gustCycles[1], 0.45 + side * 0.05)(i)
      const c = 0.5 + 0.5 * lfo(gustCycles[2], 0.8)(i)
      return smooth(0.5 * a + 0.35 * b + 0.15 * c)
    }
    const out = new Float32Array(N)

    // muffled body of the wind: what you hear through walls
    const bed = lp(noise(), 260, 0.9)
    const bed2 = lp(noise(), 700, 0.7)
    for (let i = 0; i < N; i++) out[i] += bed[i] * (0.9 + 1.6 * gust(i)) * 3.2 + bed2[i] * (0.15 + 0.8 * gust(i)) * 1.1

    // howling in the chimney / eaves: resonant, slowly gliding whistles
    const voices = [
      { f: 310, q: 38, depth: 0.22, cyc: [2, 7], amp: 1.0, ph: 0.0 },
      { f: 470, q: 46, depth: 0.28, cyc: [3, 9], amp: 0.8, ph: 0.3 },
      { f: 690, q: 52, depth: 0.2, cyc: [4, 11], amp: 0.55, ph: 0.6 },
      { f: 245, q: 30, depth: 0.15, cyc: [1, 5], amp: 0.9, ph: 0.9 },
    ]
    for (const v of voices) {
      const l1 = lfo(v.cyc[0], v.ph + side * 0.11), l2 = lfo(v.cyc[1], v.ph * 2)
      const w = svf(noise(), (i) => v.f * (1 + v.depth * l1(i) + v.depth * 0.4 * l2(i)), v.q, 'bp')
      const swell = (i) => Math.pow(gust((i + Math.floor(N * (v.ph * 0.13))) % N), 1.6)
      for (let i = 0; i < N; i++) out[i] += w[i] * swell(i) * v.amp * 9
    }

    // very soft sub-rumble, more felt than heard
    const sub = lp(noise(), 70, 0.8)
    for (let i = 0; i < N; i++) out[i] += sub[i] * (0.5 + gust(i)) * 5

    // everything arrives through glass and wall: roll the top off
    return lp(out, 1800, 0.6)
  })
  normalize(ch, -19.5)
  return ch
}

// ---------- Rain: soft, steady rain on a window pane and roof ----------
function rain() {
  seed = 29
  const ch = [0, 1].map((side) => {
    const out = new Float32Array(N)
    const mod = (i) => 1 + 0.12 * lfo(7, side * 0.2)(i) + 0.08 * lfo(13, 0.3)(i)

    // even hush of far-away rain
    const hush = lp(hp(noise(), 600), 6500)
    const warm = lp(noise(), 320, 0.8)
    for (let i = 0; i < N; i++) out[i] += hush[i] * mod(i) * 1.0 + warm[i] * 1.4

    // individual drops ticking on the glass (circular write so the loop stays seamless)
    const drop = (at, freq, decay, amp) => {
      const len = Math.floor(decay * SR * 5)
      const ph = rnd() * TAU
      for (let k = 0; k < len; k++) {
        const t = k / SR
        const e = Math.exp(-t / decay)
        out[(at + k) % N] += amp * e * (Math.sin(TAU * freq * t + ph) * 0.7 + (rnd() * 2 - 1) * 0.3)
      }
    }
    const fine = Math.floor(DUR * 70)
    for (let d = 0; d < fine; d++) {
      const amp = Math.exp(gauss() * 0.6) * 0.16
      drop(Math.floor(rnd() * N), 1800 + rnd() * 3200, 0.004 + rnd() * 0.012, amp)
    }
    const big = Math.floor(DUR * 5)
    for (let d = 0; d < big; d++) {
      const amp = Math.exp(gauss() * 0.4) * 0.45
      drop(Math.floor(rnd() * N), 700 + rnd() * 700, 0.02 + rnd() * 0.03, amp)
    }
    // gentle pad of the roof
    const roof = lp(hp(noise(), 180), 1100, 0.7)
    for (let i = 0; i < N; i++) out[i] += roof[i] * 0.9 * mod(i)
    return out
  })
  normalize(ch, -19.2)
  return ch
}

const dir = process.argv[2] ?? "."
writeWav(`${dir}/blizzard-room.wav`, blizzard())
writeWav(`${dir}/rain-cozy.wav`, rain())
console.log('ok')
