// Icons for activities, apart from the activity table so the data (used by
// the store) doesn't pull in the icon library.
import { Bike, Brush, Dribbble, Dumbbell, Flame, Flower2, Goal, Mountain, Music, Shovel, Waves, Wind, Zap, type LucideIcon } from 'lucide-react'

import type { ActivityType } from './activities'

/** The icon drawn for each activity (no emoji anywhere in the app) */
export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  gym: Dumbbell,
  running: Wind,
  cycling: Bike,
  football: Goal,
  basketball: Dribbble,
  swimming: Waves,
  hiking: Mountain,
  dancing: Music,
  skipping: Zap,
  aerobics: Flame,
  farming: Shovel,
  housework: Brush,
  yoga: Flower2,
}
