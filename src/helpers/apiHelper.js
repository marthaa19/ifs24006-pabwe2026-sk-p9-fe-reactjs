// Wrapper fetch terpusat: menyuntikkan token Bearer & mengurai respons standar {status, message, data}.
const TOKEN_KEY = 'token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server', 0)
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (!res.ok || json?.status !== 'success') {
    throw new ApiError(json?.message || 'Terjadi kesalahan pada server', res.status)
  }
  return json
}
