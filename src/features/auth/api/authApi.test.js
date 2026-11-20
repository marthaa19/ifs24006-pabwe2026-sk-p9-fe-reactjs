import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, clearToken, setToken } from '../../../helpers/apiHelper'
import { getProfile, login, logout, register } from './authApi'

vi.mock('../../../helpers/apiHelper', () => ({
  apiRequest: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}))

describe('authApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('login menyimpan token & mengembalikan user', async () => {
    apiRequest.mockResolvedValue({ data: { token: 'tok', user: { id: 1 } } })
    expect(await login('admin', 'admin')).toEqual({ id: 1 })
    expect(apiRequest).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin' },
    })
    expect(setToken).toHaveBeenCalledWith('tok')
  })

  it('register menyimpan token & mengembalikan user', async () => {
    apiRequest.mockResolvedValue({ data: { token: 'tok2', user: { id: 2 } } })
    expect(await register('budi', 'b@x.com', 'rahasia')).toEqual({ id: 2 })
    expect(apiRequest).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: { username: 'budi', email: 'b@x.com', password: 'rahasia' },
    })
    expect(setToken).toHaveBeenCalledWith('tok2')
  })

  it('getProfile mengembalikan data profil', async () => {
    apiRequest.mockResolvedValue({ data: { id: 3 } })
    expect(await getProfile()).toEqual({ id: 3 })
    expect(apiRequest).toHaveBeenCalledWith('/api/auth/profile')
  })

  it('logout memanggil API lalu menghapus token', async () => {
    apiRequest.mockResolvedValue({})
    await logout()
    expect(apiRequest).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(clearToken).toHaveBeenCalled()
  })

  it('logout tetap menghapus token walau API gagal', async () => {
    apiRequest.mockRejectedValue(new Error('x'))
    await logout()
    expect(clearToken).toHaveBeenCalled()
  })
})
