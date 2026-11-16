import { describe, expect, it } from 'vitest'
import { keepPendingWalk, listPendingWalks, pendingWalksFor, removePendingWalk, type PendingWalk } from './pendingWalks'

const walk = (id: string, userId = 'u1'): PendingWalk => ({
  id, userId, startedAt: '2026-10-09T05:00:00Z', steps: 6000, distanceKm: 4.5, caloriesKcal: 180, durationSec: 3600,
  trail: [{ lat: -1.09, lng: 37.01 }], note: 'Walk · 1:00:00',
})

describe('pending walks', () => {
  it('keeps a walk until it is removed', () => {
    keepPendingWalk(walk('w1'))
    expect(listPendingWalks().map((w) => w.id)).toEqual(['w1'])
    removePendingWalk('w1')
    expect(listPendingWalks()).toEqual([])
  })

  it('replaces a walk with the same id instead of duplicating it', () => {
    keepPendingWalk(walk('w1'))
    keepPendingWalk({ ...walk('w1'), steps: 6100 })
    expect(listPendingWalks()).toHaveLength(1)
    expect(listPendingWalks()[0].steps).toBe(6100)
  })

  it("only hands out a user's own walks", () => {
    keepPendingWalk(walk('w1', 'u1'))
    keepPendingWalk(walk('w2', 'u2'))
    expect(pendingWalksFor('u1').map((w) => w.id)).toEqual(['w1'])
    expect(pendingWalksFor(undefined)).toEqual([])
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('lp_pending_walks', '{not json')
    expect(listPendingWalks()).toEqual([])
    keepPendingWalk(walk('w1'))
    expect(listPendingWalks()).toHaveLength(1)
  })
})
