import type { Lang } from '../state/types'
import { en, type Dict } from './en'
import { ru } from './ru'

export const DICTS: Record<Lang, Dict> = { en, ru }
export type { Dict }
