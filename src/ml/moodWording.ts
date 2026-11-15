import type { MoodEffect } from '../api/ml'

// Plain-language sentences for the mood model's results. Kept gentle: these
// are patterns in someone's own logs, not medical advice or proven causes.

type HabitText = {
  habit: string // "more sleep"
  plural?: boolean // "more steps go" rather than "goes"
  per: string // "per extra hour"
  when?: string // "the day before"
  to: string // page to act on it
  tip: { up: string; down: string } // what to try when more helps / when less helps
}

export const HABITS: Record<string, HabitText> = {
  sleepHours: { habit: 'more sleep', per: 'per extra hour', to: '/physical',
    tip: { up: 'Try getting to bed 30 minutes earlier tonight.', down: 'Long lie-ins don’t seem to help you. Keep a steady bedtime.' } },
  stepsK: { habit: 'more steps', plural: true, per: 'per 1,000 steps', when: 'the day before', to: '/physical',
    tip: { up: 'A 15-minute walk today could help tomorrow.', down: 'Make sure busy, active days include some rest too.' } },
  screenHours: { habit: 'more screen time', per: 'per extra hour', when: 'the day before', to: '/digital',
    tip: { up: 'Screen time doesn’t seem to drag you down. Just keep it intentional.', down: 'Try one screen-free hour this evening.' } },
  socialHours: { habit: 'more social media', per: 'per extra hour', when: 'the day before', to: '/digital',
    tip: { up: 'Time connecting with people seems good for you.', down: 'Try setting a social media limit for today.' } },
  focusHours: { habit: 'more focused work', per: 'per extra hour', when: 'the day before', to: '/productivity',
    tip: { up: 'A focus session today could lift tomorrow.', down: 'Long focus days seem to tire you. Build in breaks.' } },
  waterGlasses: { habit: 'more water', per: 'per extra glass', when: 'the day before', to: '/nutrition',
    tip: { up: 'Keep a glass of water nearby today.', down: 'Water doesn’t seem to change much for you either way.' } },
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

/** "+0.3" style size on the 1-5 mood scale; null when too small to be worth showing */
function size(mean: number): string | null {
  const v = Math.abs(mean)
  if (v < 0.01) return null
  return `${mean > 0 ? '+' : '−'}${v < 0.1 ? v.toFixed(2) : v.toFixed(1)}`
}

export type EffectSentence = {
  headline: string // "For you, more sleep goes with a better mood."
  detail: string | null // "About +0.3 on your 1–5 mood per extra hour."
  tip: string
  to: string
  helps: boolean
}

export function describeEffect(e: MoodEffect): EffectSentence | null {
  const h = HABITS[e.feature]
  if (!h) return null
  const helps = e.mean > 0
  const outcome = helps ? 'a better mood' : 'a lower mood'
  const habit = h.when ? `${h.habit} ${h.when}` : h.habit
  const headline = e.claim === 'personal'
    ? `For you, ${habit} ${h.plural ? 'go' : 'goes'} with ${outcome}.`
    : `For most people, ${habit} ${h.plural ? 'go' : 'goes'} with ${outcome}.`
  const s = size(e.mean)
  const detail = s ? `About ${s} on a 1–5 mood ${h.per}.` : null
  return { headline: cap(headline), detail, tip: helps ? h.tip.up : h.tip.down, to: h.to, helps }
}

/** Words for a forecast mood (1-5): supportive whatever the number */
export function describeForecast(mean: number): { title: string; body: string } {
  if (mean >= 4) return { title: 'Today looks like a good day', body: 'Your recent days point to a good mood today. Keep doing what works.' }
  if (mean >= 3.2) return { title: 'Today looks steady', body: 'Your recent days point to an okay, steady mood today.' }
  if (mean >= 2.5) return { title: 'Today might feel a little heavier', body: 'Your recent days point to a lower mood than usual. Be kind to yourself today.' }
  return { title: 'Today might be a harder day', body: 'Your recent days point to a low mood. Go gently, and reach out to someone if you need to.' }
}
