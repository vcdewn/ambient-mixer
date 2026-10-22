import {
  CloudLightning,
  CloudRain,
  Coffee,
  Flame,
  Trees,
  TrainFront,
  type LucideIcon,
} from 'lucide-react'

export const SOUND_IDS = ['rain', 'thunder', 'campfire', 'cafe', 'forest', 'train'] as const
export type SoundId = (typeof SOUND_IDS)[number]

export interface SoundDef {
  id: SoundId
  icon: LucideIcon
  /** Path relative to the site base (public/). Replace placeholders with real CC0 / CC-BY loops. */
  file: string
  /** Attribution shown in the Credits block. Fill in when swapping the placeholder files. */
  credit: { title: string; author: string; license: string; url?: string }
}

const placeholder = { title: 'Placeholder (replace me)', author: '—', license: 'generated' }

export const SOUNDS: SoundDef[] = [
  { id: 'rain', icon: CloudRain, file: 'audio/rain.wav', credit: placeholder },
  { id: 'thunder', icon: CloudLightning, file: 'audio/thunder.wav', credit: placeholder },
  { id: 'campfire', icon: Flame, file: 'audio/campfire.wav', credit: placeholder },
  { id: 'cafe', icon: Coffee, file: 'audio/cafe.wav', credit: placeholder },
  { id: 'forest', icon: Trees, file: 'audio/forest.wav', credit: placeholder },
  { id: 'train', icon: TrainFront, file: 'audio/train.wav', credit: placeholder },
]
