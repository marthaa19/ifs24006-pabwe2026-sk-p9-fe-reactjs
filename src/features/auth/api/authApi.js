// API autentikasi: login, register, profil, logout.
import { apiRequest, clearToken, setToken } from '../../../helpers/apiHelper'

export async function login(username, password) {
  const res = await apiRequest('/api/auth/login', { method: 'POST', body: { username, password } })
  setToken(res.data.token)
  return res.data.user
}

export async function register(username, email, password) {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { username, email, password },
  })
  setToken(res.data.token)
  return res.data.user
}

export async function getProfile() {
  const res = await apiRequest('/api/auth/profile')
  return res.data
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' })
  } catch {
    // abaikan: sesi lokal tetap harus dihapus walau server gagal dihubungi
  }
  clearToken()
}
