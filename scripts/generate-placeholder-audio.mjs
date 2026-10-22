// Generates short seamless-looping placeholder sounds into public/audio/*.wav.
// Replace them with real CC0 / CC-BY recordings (and update src/data/sounds.ts + credits).
import { writeFileSync, mkdirSync } from 'node:fs'

const RATE = 22050
const SECONDS = 10
const N = RATE * SECONDS
mkdirSync('public/audio', { recursive: true })

let seed = 1234567
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const noise = () => rand() * 2 - 1

function lowpass(x, a) { let y = 0; return x.map((v) => (y += a * (v - y))) }
function highpass(x, a) { const lp = lowpass(x, a); return x.map((v, i) => v - lp[i]) }
function brown(n) { let y = 0; return Float32Array.from({ length: n }, () => (y = (y + 0.02 * noise()) / 1.02) * 3.5) }
function normalize(x, peak = 0.7) { let m = 1e-9; for (const v of x) m = Math.max(m, Math.abs(v)); return x.map((v) => (v / m) * peak) }

// cross-fade the tail into the head so the loop has no click
function loopable(x) {
  const fade = Math.floor(RATE * 0.6)
  const out = Float32Array.from(x)
  for (let i = 0; i < fade; i++) {
    const t = i / fade
    out[i] = x[i] * t + x[N - fade + i] * (1 - t)
  }
  return out.subarray(0, N - fade)
}

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40)
  samples.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2))
  return buf
}

const noiseArr = (n = N) => Float32Array.from({ length: n }, noise)
const sines = (f, i) => Math.sin((2 * Math.PI * f * i) / RATE)

const sounds = {
  rain() {
    const base = highpass(lowpass(noiseArr(), 0.6), 0.05)
    return base.map((v, i) => v * (0.8 + 0.2 * sines(0.3, i)))
  },
  thunder() {
    const b = brown(N)
    const out = new Float32Array(N)
    for (let i = 0; i < N; i++) out[i] = b[i] * 0.25
    for (const at of [1.5, 6.2]) {
      const start = Math.floor(at * RATE)
      for (let i = 0; i < RATE * 3 && start + i < N; i++) out[start + i] += b[(start + i * 3) % N] * Math.exp(-i / (RATE * 0.9)) * 2
    }
    return out
  },
  campfire() {
    const out = Float32Array.from(lowpass(brown(N), 0.2), (v) => v * 0.6)
    for (let k = 0; k < 90; k++) {
      const at = Math.floor(rand() * (N - 400)), amp = 0.3 + rand() * 0.7
      for (let i = 0; i < 300; i++) out[at + i] += noise() * amp * Math.exp(-i / 40)
    }
    return out
  },
  cafe() {
    const murmur = lowpass(highpass(noiseArr(), 0.02), 0.12)
    const out = murmur.map((v, i) => v * (0.6 + 0.4 * sines(0.7, i) * sines(0.23, i)))
    for (let k = 0; k < 8; k++) {
      const at = Math.floor(rand() * (N - 6000)), f = 2200 + rand() * 1800
      for (let i = 0; i < 5000; i++) out[at + i] += sines(f, i) * 0.25 * Math.exp(-i / 700)
    }
    return out
  },
  forest() {
    const wind = lowpass(noiseArr(), 0.05).map((v, i) => v * (0.5 + 0.5 * sines(0.15, i)))
    const out = Float32Array.from(wind, (v) => v * 1.2)
    for (let i = 0; i < N; i++) {
      const gate = Math.max(0, sines(5.5, i)) * (0.5 + 0.5 * sines(0.4, i))
      out[i] += sines(4300, i) * gate * 0.12 + sines(3900, i) * gate * 0.08
    }
    return out
  },
  train() {
    const out = Float32Array.from(lowpass(brown(N), 0.3), (v) => v * 0.5)
    const beat = Math.floor(RATE * 0.5)
    for (let at = 0; at + 1500 < N; at += beat) {
      const accent = (at / beat) % 4 < 2 ? 1 : 0.6
      for (let i = 0; i < 1500; i++) out[at + i] += noise() * accent * 0.8 * Math.exp(-i / 160)
    }
    return out
  },
}

for (const [name, make] of Object.entries(sounds)) {
  const data = loopable(normalize(make()))
  writeFileSync(`public/audio/${name}.wav`, wav(data))
  console.log(name, `${(data.length / RATE).toFixed(1)}s`)
}
