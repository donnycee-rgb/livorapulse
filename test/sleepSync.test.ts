import { beforeEach, describe, expect, it, vi } from 'vitest'

// The server and the outbox are stand-ins; the rules are the real ones
const server = { startedAt: null as string | null }
const sent: Array<{ startedAt: string | null }> = []
let queued: Array<{ path: string }> = []
let online = true

vi.mock('../src/api/client', () => ({
  apiGet: vi.fn(async () => ({ data: { startedAt: server.startedAt } })),
}))
vi.mock('../src/offline/outbox', () => ({
  pendingFor: () => queued,
  saveLog: vi.fn(async (_path: string, body: { startedAt: string | null }) => {
    sent.push(body)
    if (!online) { queued.push({ path: _path }); return 'queued' }
    server.startedAt = body.startedAt
    return 'sent'
  }),
}))

// The stores save to localStorage: a simple one in memory
const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, String(v)) },
  removeItem: (k: string) => { mem.delete(k) },
})

const { useAuthStore } = await import('../src/store/useAuthStore')
const { useSleepSession } = await import('../src/store/useSleepSession')
const { pullSleepSession } = await import('../src/lib/sleepSync')

const HOUR = 3600000
const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  server.startedAt = null
  sent.length = 0
  queued = []
  online = true
  useAuthStore.setState({ user: { id: 'me', name: 'Me', email: 'me@example.test' } } as never)
  useSleepSession.setState({ startedAt: null, userId: null, synced: false })
})

describe('the same sleep on every device', () => {
  it('a sleep started on another device shows here', async () => {
    const t = Date.now() - HOUR
    server.startedAt = new Date(t).toISOString()
    await pullSleepSession()
    expect(useSleepSession.getState()).toMatchObject({ startedAt: t, userId: 'me', synced: true })
  })

  it('ended on another device: the banner goes here too', async () => {
    useSleepSession.setState({ startedAt: Date.now() - HOUR, userId: 'me', synced: true })
    await pullSleepSession()
    expect(useSleepSession.getState().startedAt).toBeNull()
  })

  it("a sleep the server never got is sent up, not wiped", async () => {
    const t = Date.now() - HOUR
    useSleepSession.setState({ startedAt: t, userId: 'me', synced: false })
    await pullSleepSession()
    expect(useSleepSession.getState().startedAt).toBe(t)
    expect(server.startedAt).toBe(new Date(t).toISOString())
    expect(useSleepSession.getState().synced).toBe(true)
  })

  it("a tap still waiting to upload isn't overwritten by the server", async () => {
    const t = Date.now()
    useSleepSession.setState({ startedAt: t, userId: 'me', synced: false })
    queued = [{ path: '/api/push/sleep-session' }]
    await pullSleepSession()
    expect(useSleepSession.getState().startedAt).toBe(t)
    expect(sent).toHaveLength(0)
  })

  it("another person's sleep on this phone isn't shown", async () => {
    useSleepSession.setState({ startedAt: Date.now() - HOUR, userId: 'someone-else', synced: true })
    server.startedAt = null
    await pullSleepSession()
    expect(useSleepSession.getState().userId).toBe('someone-else')
  })
})

describe('taps go to the server', () => {
  it('start and end are sent; what came from the server is not sent back', async () => {
    const { startSleepSessionSync } = await import('../src/lib/sleepSync')
    vi.stubGlobal('window', { addEventListener: () => {} })
    vi.stubGlobal('document', { visibilityState: 'hidden' })
    startSleepSessionSync()

    useSleepSession.getState().start('me')
    await flush()
    expect(sent.at(-1)!.startedAt).not.toBeNull()
    expect(useSleepSession.getState().synced).toBe(true)

    useSleepSession.getState().clear()
    await flush()
    expect(sent.at(-1)!.startedAt).toBeNull()

    const before = sent.length
    server.startedAt = new Date(Date.now() - HOUR).toISOString()
    await pullSleepSession()
    await flush()
    expect(sent.length).toBe(before) // applying the server's answer doesn't echo it back
  })
})
