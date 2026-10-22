import {
  CloudLightning,
  CloudRain,
  Car,
  Flame,
  Trees,
  TrainFront,
  type LucideIcon,
} from 'lucide-react'

export const SOUND_IDS = ['rain', 'thunder', 'campfire', 'highway', 'forest', 'train'] as const
export type SoundId = (typeof SOUND_IDS)[number]

export interface SoundDef {
  id: SoundId
  icon: LucideIcon
  /** Path relative to the site base (public/). */
  file: string
  /** Attribution shown in the Credits block (required by CC BY / CC BY-SA). */
  credit: { title: string; author: string; license: string; url: string }
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const SOUNDS: SoundDef[] = [
  {
    id: 'rain', icon: CloudRain, file: 'audio/rain.m4a',
    credit: { title: 'Listening to Raindrops (large loop)', author: 'NASA', license: 'Public domain', url: `${COMMONS}Listening_to_Raindrops_(1035382_-_large_loop).mp3` },
  },
  {
    id: 'thunder', icon: CloudLightning, file: 'audio/thunder.m4a',
    credit: { title: 'rbh-thunder-storm', author: 'RHumphries', license: 'CC BY 3.0', url: `${COMMONS}Rhumphries_-_rbh-thunder-storm.ogg` },
  },
  {
    id: 'campfire', icon: Flame, file: 'audio/campfire.m4a',
    credit: { title: 'Campfire sound ambience', author: 'Glaneur de sons', license: 'CC BY 3.0', url: `${COMMONS}Campfire_sound_ambience.ogg` },
  },
  {
    id: 'highway', icon: Car, file: 'audio/highway.m4a',
    credit: { title: 'Highway from bridge center', author: 'stephan', license: 'Public domain', url: `${COMMONS}Highway_from_bridge_center.ogg` },
  },
  {
    id: 'forest', icon: Trees, file: 'audio/forest.m4a',
    credit: { title: 'Audio Hörbild Grillenzirpen – nachts um 3 im Föhrenwald Mödling', author: 'DrTrumpet', license: 'CC BY-SA 4.0', url: `${COMMONS}Audio_H%C3%B6rbild_Grillenzirpen_-_nachts_um_3_im_F%C3%B6hrenwald_M%C3%B6dling.ogg` },
  },
  {
    id: 'train', icon: TrainFront, file: 'audio/train.m4a',
    credit: { title: 'Стук колёс поезда', author: 'Ural-66', license: 'CC0', url: `${COMMONS}%D0%A1%D1%82%D1%83%D0%BA_%D0%BA%D0%BE%D0%BB%D1%91%D1%81_%D0%BF%D0%BE%D0%B5%D0%B7%D0%B4%D0%B0.ogg` },
  },
]
