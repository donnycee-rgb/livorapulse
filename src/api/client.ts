import { getAccessToken, OfflineError, renewSession, sessionExpired } from './session'

export type ApiError = {
  message: string
  details?: unknown
}

// Empty string routes through the Vite proxy to localhost:4000
// In production this should be set to your API domain via VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function parseJsonSafe(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * fetch with the sign-in token. If the token has run out (401), the session
 * is renewed once and the request retried; if it can't be renewed, the user
 * is sent to sign in again. A network failure throws OfflineError and never
 * signs anyone out.
 */
async function authedFetch(url: string, init: RequestInit, auth: boolean): Promise<Response> {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers)
    if (auth && token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(url, { ...init, headers }).catch(() => {
      throw new OfflineError()
    })
  }

  const token = auth ? getAccessToken() : null
  const res = await send(token)
  if (res.status !== 401 || !auth || !token) return res

  const renewed = await renewSession(token)
  if (!renewed) {
    sessionExpired()
    throw Object.assign(new Error('Your session has ended. Please sign in again.'), { status: 401, sessionEnded: true })
  }
  return send(renewed)
}

async function toError(res: Response): Promise<Error> {
  const data = await parseJsonSafe(res)
  const errMsg = data?.error?.message || res.statusText || 'Request failed'
  const err: ApiError = { message: errMsg, details: data?.error?.details }
  return Object.assign(new Error(err.message), { status: res.status, details: err.details })
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { auth?: boolean },
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const headers = new Headers(options?.headers)
  headers.set('Accept', 'application/json')

  const hasBody = options?.body !== undefined
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const { auth = true, ...init } = options ?? {}
  const res = await authedFetch(url, { ...init, headers }, auth)
  if (!res.ok) throw await toError(res)

  const data = await parseJsonSafe(res)
  return data as T
}

/** For file downloads (e.g. a PDF): same auth and error handling, returns the body as a Blob */
export async function apiBlob(path: string, auth = true): Promise<Blob> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await authedFetch(url, {}, auth)
  if (!res.ok) throw await toError(res)
  return res.blob()
}

/** Full URL for an API path, for plain links (e.g. a public PDF) */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export function apiGet<T>(path: string, auth = true) {
  return apiRequest<T>(path, { method: 'GET', auth })
}

export function apiPost<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    auth,
  })
}

export function apiPut<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
    auth,
  })
}

export function apiDel<T>(path: string, auth = true) {
  return apiRequest<T>(path, { method: 'DELETE', auth })
}

export const apiFetch = apiRequest
export const get = apiGet
export const post = apiPost
export const put = apiPut
export const del = apiDel