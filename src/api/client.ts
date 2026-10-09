export type ApiError = {
  message: string
  details?: unknown
}

// Empty string routes through the Vite proxy to localhost:4000
// In production this should be set to your API domain via VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL ?? ''

function getToken(): string | null {
  return localStorage.getItem('lp_access_token')
}

async function parseJsonSafe(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
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

  const auth = options?.auth ?? true
  if (auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const data = await parseJsonSafe(res)
    const errMsg = data?.error?.message || res.statusText || 'Request failed'
    const details = data?.error?.details
    const err: ApiError = { message: errMsg, details }
    throw Object.assign(new Error(err.message), { status: res.status, details: err.details })
  }

  const data = await parseJsonSafe(res)
  return data as T
}

/** For file downloads (e.g. a PDF): same auth and error handling, returns the body as a Blob */
export async function apiBlob(path: string, auth = true): Promise<Blob> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const headers = new Headers()
  if (auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const data = await parseJsonSafe(res)
    throw Object.assign(new Error(data?.error?.message || res.statusText || 'Request failed'), { status: res.status })
  }
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