import { CloudRain, Frown, Meh, Smile, SmilePlus, type LucideIcon } from 'lucide-react'
import type { MoodEmoji } from '../data/types'

// Moods are stored as emoji (the API and database use them as values), but the
// app never shows emoji: each mood is drawn with one of these icons instead.
// The same set as the Mood page, so a mood looks the same everywhere.
export const MOOD_ICONS: Record<MoodEmoji, { Icon: LucideIcon; label: string; color: string }> = {
  '😄': { Icon: SmilePlus, label: 'Excellent', color: '#4CAF50' },
  '🙂': { Icon: Smile, label: 'Good', color: '#00BCD4' },
  '😐': { Icon: Meh, label: 'Neutral', color: '#FFA500' },
  '😕': { Icon: Frown, label: 'Low', color: '#FF8C00' },
  '😣': { Icon: CloudRain, label: 'Stressed', color: '#FF6B6B' },
}

/** Worst to best, for pickers */
export const MOOD_ORDER: readonly MoodEmoji[] = ['😣', '😕', '😐', '🙂', '😄']
