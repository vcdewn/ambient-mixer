import {
  CloudLightning,
  CloudRain,
  Car,
  Flame,
  Snowflake,
  Trees,
  TrainFront,
  Waves,
  type LucideIcon,
} from 'lucide-react'

export const SOUND_IDS = ['rain', 'thunder', 'blizzard', 'forest', 'campfire', 'beach', 'highway', 'train'] as const
export type SoundId = (typeof SOUND_IDS)[number]

export interface SoundDef {
  id: SoundId
  icon: LucideIcon
  /** Card accent: tints the active card, its switch, slider and animation. */
  color: string
  /** Path relative to the site base (public/). */
  file: string
  /** Attribution shown in the Credits block (required by CC BY / CC BY-SA). */
  credit: { title: string; author: string; license: string; url: string }
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const SOUNDS: SoundDef[] = [
  {
    id: 'rain', icon: CloudRain, color: '#7cb5ff', file: 'audio/rain-calm.m4a',
    credit: { title: 'Calm rain', author: 'Zuvji', license: 'CC BY-SA 4.0', url: `${COMMONS}Calm_rain.wav` },
  },
  {
    id: 'thunder', icon: CloudLightning, color: '#c4a8ff', file: 'audio/thunder.m4a',
    credit: { title: 'rbh-thunder-storm', author: 'RHumphries', license: 'CC BY 3.0', url: `${COMMONS}Rhumphries_-_rbh-thunder-storm.ogg` },
  },
  {
    id: 'blizzard', icon: Snowflake, color: '#d6e6ff', file: 'audio/blizzard-room.m4a',
    credit: { title: 'Blizzard outside a warm room (synthesized)', author: 'Ambient Mixer', license: 'CC0', url: '' },
  },
  {
    id: 'forest', icon: Trees, color: '#7fdba0', file: 'audio/forest-pond.m4a',
    credit: { title: 'Nature sounds ambience in a Dordogne pond', author: 'Glaneur de sons', license: 'CC BY 3.0', url: `${COMMONS}Nature_sounds_ambience_in_a_Dordogne_pond.ogg` },
  },
  {
    id: 'campfire', icon: Flame, color: '#ffa05c', file: 'audio/campfire.m4a',
    credit: { title: 'Campfire sound ambience', author: 'Glaneur de sons', license: 'CC BY 3.0', url: `${COMMONS}Campfire_sound_ambience.ogg` },
  },
  {
    id: 'beach', icon: Waves, color: '#5fd6d6', file: 'audio/beach-waves.m4a',
    credit: { title: 'Ocean Waves on a Tropical Beach', author: 'Jarrod stanley', license: 'CC0', url: `${COMMONS}Ocean_Waves_on_a_Tropical_Beach.ogg` },
  },
  {
    id: 'highway', icon: Car, color: '#ffcf6b', file: 'audio/highway.m4a',
    credit: { title: 'Highway from bridge center', author: 'stephan', license: 'Public domain', url: `${COMMONS}Highway_from_bridge_center.ogg` },
  },
  {
    id: 'train', icon: TrainFront, color: '#f29ec0', file: 'audio/train.m4a',
    credit: { title: 'Стук колёс поезда', author: 'Ural-66', license: 'CC0', url: `${COMMONS}%D0%A1%D1%82%D1%83%D0%BA_%D0%BA%D0%BE%D0%BB%D1%91%D1%81_%D0%BF%D0%BE%D0%B5%D0%B7%D0%B4%D0%B0.ogg` },
  },
]
