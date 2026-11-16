// One colour per habit, used for its icons, rings, tiles and charts (never for
// whole-card backgrounds). `rgb` is the same colour as "r g b" channels, for
// the .lp-tile tint and Tailwind-style opacity.

export type Habit = 'steps' | 'sleep' | 'meals' | 'focus' | 'screen' | 'mood' | 'stress' | 'water' | 'eco'

export const HABIT: Record<Habit, { hex: string; rgb: string }> = {
  steps: { hex: '#22C55E', rgb: '34 197 94' },
  sleep: { hex: '#8B5CF6', rgb: '139 92 246' },
  meals: { hex: '#F97316', rgb: '249 115 22' },
  focus: { hex: '#6366F1', rgb: '99 102 241' },
  screen: { hex: '#0EA5E9', rgb: '14 165 233' },
  mood: { hex: '#EC4899', rgb: '236 72 153' },
  stress: { hex: '#A78BFA', rgb: '167 139 250' },
  water: { hex: '#38BDF8', rgb: '56 189 248' },
  eco: { hex: '#10B981', rgb: '16 185 129' },
}

/** Brand green, as the ring/accent colour (matches --lp-primary in each theme) */
export const BRAND = 'rgb(var(--lp-primary))'
