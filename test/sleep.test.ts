import { describe, expect, it } from 'vitest'
import { fmtDuration, greeting, sleepKind, spanProblem, timesToSpan } from '../src/lib/sleep'

const at = (d: string) => new Date(d).getTime() // local time
const H = 3600000

describe('typed times', () => {
  it('a bedtime later than the wake-up was the evening before', () => {
    const { start, end } = timesToSpan('23:10', '06:35', new Date('2026-11-20T12:00'))
    expect(new Date(start)).toEqual(new Date('2026-11-19T23:10'))
    expect(new Date(end)).toEqual(new Date('2026-11-20T06:35'))
    expect((end - start) / 60000).toBe(445)
  })

  it('an afternoon nap stays on the same day', () => {
    const { start, end } = timesToSpan('14:00', '14:40', new Date('2026-11-20T18:00'))
    expect((end - start) / 60000).toBe(40)
    expect(new Date(start).getDate()).toBe(20)
  })

  it('after midnight: 01:30 to 08:00 the same morning', () => {
    const { start, end } = timesToSpan('01:30', '08:00', new Date('2026-11-20T09:00'))
    expect((end - start) / H).toBe(6.5)
  })
})

describe('night or nap', () => {
  it('long sleeps and evening bedtimes are nights; short daytime sleeps are naps', () => {
    expect(sleepKind(at('2026-11-19T23:10'), at('2026-11-20T06:35'))).toBe('night')
    expect(sleepKind(at('2026-11-20T02:00'), at('2026-11-20T04:00'))).toBe('night')
    expect(sleepKind(at('2026-11-20T14:00'), at('2026-11-20T14:40'))).toBe('nap')
    expect(sleepKind(at('2026-11-20T09:00'), at('2026-11-20T13:00'))).toBe('night') // 4 hours after a night shift
  })
})

describe('what can be saved', () => {
  const now = at('2026-11-20T07:00')
  it('ordinary nights are fine', () => {
    expect(spanProblem(at('2026-11-19T23:00'), at('2026-11-20T06:30'), now)).toBeNull()
  })
  it('too short, too long, or waking up in the future', () => {
    expect(spanProblem(at('2026-11-20T06:00'), at('2026-11-20T06:05'), now)).toMatch(/under 10 minutes/)
    expect(spanProblem(at('2026-11-19T06:00'), at('2026-11-20T06:30'), now)).toMatch(/over 20 hours/)
    expect(spanProblem(at('2026-11-19T23:00'), at('2026-11-20T09:00'), now)).toMatch(/still to come/)
  })
})

it('durations and greetings read naturally', () => {
  expect(fmtDuration(445)).toBe('7h 25m')
  expect(fmtDuration(45)).toBe('45m')
  expect(fmtDuration(480)).toBe('8h')
  expect(greeting(at('2026-11-20T06:35'))).toBe('Good morning')
  expect(greeting(at('2026-11-20T15:00'))).toBe('Good afternoon')
  expect(greeting(at('2026-11-20T02:00'))).toBe('Welcome back')
})
