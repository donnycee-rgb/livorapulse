import { beforeEach, describe, expect, it, vi } from 'vitest'

const net = vi.hoisted(() => ({
  online: true,
  failWith: null as null | { status: number },
  sent: [] as { path: string; body: unknown; key: string | null }[],
}))

vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'u1' } }) },
}))
vi.mock('../api/client', () => ({
  apiRequest: async (path: string, init: { body: string; headers: Record<string, string> }) => {
    if (!net.online) throw Object.assign(new Error('offline'), { offline: true })
    if (net.failWith) throw Object.assign(new Error('rejected'), net.failWith)
    net.sent.push({ path, body: JSON.parse(init.body), key: init.headers['Idempotency-Key'] ?? null })
    return { success: true }
  },
}))

import { flushOutbox, isRetryable, listOutbox, pendingFor, removeFromOutbox, saveLog } from './outbox'

beforeEach(() => {
  localStorage.clear()
  net.online = true
  net.failWith = null
  net.sent.length = 0
})

describe('saving a log', () => {
  it('sends straight away when online, with a key the server dedupes on', async () => {
    expect(await saveLog('/api/mood', { emoji: '🙂' })).toBe('sent')
    expect(net.sent).toHaveLength(1)
    expect(net.sent[0].key).toMatch(/^[0-9a-f]{32}$/)
    expect(listOutbox()).toHaveLength(0)
  })

  it('keeps it on the phone when offline, and uploads it later in order', async () => {
    net.online = false
    expect(await saveLog('/api/mood', { emoji: '🙂' })).toBe('queued')
    expect(await saveLog('/api/nutrition/water', { glasses: 1 })).toBe('queued')
    expect(pendingFor('u1')).toHaveLength(2)

    net.online = true
    const r = await flushOutbox()
    expect(r).toEqual({ sent: 2, dropped: 0, left: 0 })
    expect(net.sent.map((s) => s.path)).toEqual(['/api/mood', '/api/nutrition/water'])
  })

  it('uses the same key on every retry, so the server saves it once', async () => {
    net.online = false
    await saveLog('/api/eco', { type: 'Recycled' })
    const key = listOutbox()[0].id
    net.online = true
    await flushOutbox()
    expect(net.sent[0].key).toBe(key)
  })

  it("a new log waits behind older ones instead of overtaking them", async () => {
    net.online = false
    await saveLog('/api/mood', { emoji: '😐' })
    net.online = true
    expect(await saveLog('/api/mood', { emoji: '😄' })).toBe('queued')
    await flushOutbox()
    expect(net.sent.map((s) => (s.body as { emoji: string }).emoji)).toEqual(['😐', '😄'])
  })

  it('stops at the first failure while still offline and keeps the rest', async () => {
    net.online = false
    await saveLog('/api/mood', { emoji: '🙂' })
    await saveLog('/api/mood', { emoji: '😄' })
    const r = await flushOutbox()
    expect(r.sent).toBe(0)
    expect(r.left).toBe(2)
  })

  it('throws for a log the server rejects (bad data), instead of keeping it', async () => {
    net.failWith = { status: 400 }
    await expect(saveLog('/api/mood', {})).rejects.toThrow('rejected')
    expect(listOutbox()).toHaveLength(0)
  })

  it('keeps it when the server is down', async () => {
    net.failWith = { status: 503 }
    expect(await saveLog('/api/mood', { emoji: '🙂' })).toBe('queued')
  })

  it('can take back a log that has not uploaded yet', async () => {
    net.online = false
    await saveLog('/api/nutrition', { foodName: 'Ugali' })
    removeFromOutbox(listOutbox()[0].id)
    expect(listOutbox()).toHaveLength(0)
  })
})

describe('what is worth retrying', () => {
  it('retries offline, server errors and rate limits, not bad data', () => {
    expect(isRetryable({ offline: true })).toBe(true)
    expect(isRetryable({ status: 500 })).toBe(true)
    expect(isRetryable({ status: 429 })).toBe(true)
    expect(isRetryable({ status: 400 })).toBe(false)
    expect(isRetryable({ status: 404 })).toBe(false)
  })
})
