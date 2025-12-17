export type ApiError = {
  message: string
  details?: unknown
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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

export async function apiRequest<T>(path: string, options?: RequestInit & { auth?: boolean }): Promise<T> {
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

  const res = await fetch(url, {
    ...options,
    headers,
  })

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

export function apiGet<T>(path: string, auth = true) {
  return apiRequest<T>(path, { method: 'GET', auth })
}

export function apiPost<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body), auth })
}

export function apiPut<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body), auth })
}
