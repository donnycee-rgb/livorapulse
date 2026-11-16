import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken, getRefreshToken, OfflineError, renewSession, setTokens } from './session'

afterEach(() => vi.unstubAllGlobals())

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

describe('renewSession', () => {
  it('swaps the refresh token for a new pair', async () => {
    setTokens({ accessToken: 'old-a', refreshToken: 'old-r' })
    const fetchMock = vi.fn(async () => ok({ accessToken: 'new-a', refreshToken: 'new-r' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await renewSession('old-a')).toBe('new-a')
    expect(getAccessToken()).toBe('new-a')
    expect(getRefreshToken()).toBe('new-r')
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ refreshToken: 'old-r' })
  })

  it('renews only once when several requests fail together', async () => {
    setTokens({ accessToken: 'old-a', refreshToken: 'old-r' })
    const fetchMock = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10))
      return ok({ accessToken: 'new-a', refreshToken: 'new-r' })
    })
    vi.stubGlobal('fetch', fetchMock)
    const results = await Promise.all([renewSession('old-a'), renewSession('old-a'), renewSession('old-a')])
    expect(results).toEqual(['new-a', 'new-a', 'new-a'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses a token another tab already renewed, without calling the server', async () => {
    setTokens({ accessToken: 'renewed-elsewhere', refreshToken: 'r2' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await renewSession('old-a')).toBe('renewed-elsewhere')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null when the session has really ended', async () => {
    setTokens({ accessToken: 'old-a', refreshToken: 'revoked' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
    expect(await renewSession('old-a')).toBeNull()
  })

  it('returns null with no refresh token (signed in before this fix)', async () => {
    localStorage.setItem('lp_access_token', 'old-a')
    vi.stubGlobal('fetch', vi.fn())
    expect(await renewSession('old-a')).toBeNull()
  })

  it('reports being offline instead of ending the session', async () => {
    setTokens({ accessToken: 'old-a', refreshToken: 'old-r' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    await expect(renewSession('old-a')).rejects.toBeInstanceOf(OfflineError)
    expect(getRefreshToken()).toBe('old-r') // still signed in
  })
})
