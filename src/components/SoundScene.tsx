import type { CSSProperties } from 'react'
import type { SoundId } from '../data/sounds'

/** Positions are derived from the index, so a scene looks the same on every render. */
const spread = (i: number, n: number, jitter = 0.35) => ((i + 0.5 + Math.sin(i * 12.9898) * jitter) / n) * 100

function Particles({ count, className, build }: {
  count: number
  className: string
  build: (i: number) => CSSProperties
}) {
  return <>{Array.from({ length: count }, (_, i) => <span key={i} className={className} style={build(i)} />)}</>
}

const WAVE = 'M0 14 Q 12.5 0 25 14 T 50 14 T 75 14 T 100 14 V40 H0 Z'

/** Decorative animation behind a playing card. Purely visual, hidden from assistive tech. */
export function SoundScene({ id, level }: { id: SoundId; level: number }) {
  return (
    <div className="scene" aria-hidden="true" style={{ opacity: 0.4 + level * 0.6 }}>
      {id === 'rain' && (
        <Particles count={16} className="scene-drop" build={(i) => ({
          left: `${spread(i, 16)}%`, animationDelay: `${(i * 0.37) % 1.4}s`, animationDuration: `${0.9 + (i % 4) * 0.18}s`,
        })} />
      )}
      {id === 'thunder' && (
        <>
          <div className="scene-flash" />
          <svg className="scene-bolt" viewBox="0 0 24 40" fill="currentColor"><path d="M14 0 3 22h7l-3 18L21 15h-8z" /></svg>
        </>
      )}
      {id === 'blizzard' && (
        <Particles count={18} className="scene-flake" build={(i) => ({
          left: `${spread(i, 18)}%`, animationDelay: `${(i * 0.53) % 3}s`, animationDuration: `${2.4 + (i % 5) * 0.5}s`,
          width: 2 + (i % 3), height: 2 + (i % 3),
        })} />
      )}
      {id === 'forest' && (
        <Particles count={9} className="scene-firefly" build={(i) => ({
          left: `${spread(i, 9)}%`, top: `${15 + ((i * 37) % 60)}%`, animationDelay: `${(i * 0.9) % 5}s`, animationDuration: `${4 + (i % 3)}s`,
        })} />
      )}
      {id === 'campfire' && (
        <>
          <div className="scene-glow" />
          <Particles count={10} className="scene-ember" build={(i) => ({
            left: `${spread(i, 10, 0.5)}%`, animationDelay: `${(i * 0.43) % 2.5}s`, animationDuration: `${1.8 + (i % 4) * 0.5}s`,
          })} />
        </>
      )}
      {id === 'beach' && (
        <>
          <svg className="scene-wave scene-wave-back" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d={WAVE} /><path d={WAVE} transform="translate(100 0)" />
          </svg>
          <svg className="scene-wave scene-wave-front" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d={WAVE} /><path d={WAVE} transform="translate(100 0)" />
          </svg>
        </>
      )}
      {id === 'highway' && (
        <Particles count={6} className="scene-car" build={(i) => ({
          top: `${22 + i * 11}%`, animationDelay: `${(i * 0.7) % 3}s`, animationDuration: `${2 + (i % 3) * 0.7}s`,
          animationDirection: i % 2 ? 'reverse' : 'normal', ['--car' as string]: i % 2 ? '#ff6b6b' : '#ffe8a3',
        } as CSSProperties)} />
      )}
      {id === 'train' && (
        <>
          <div className="scene-track" />
          <div className="scene-sleepers" />
        </>
      )}
    </div>
  )
}
