import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, clearToken, getToken, setToken } from './apiHelper'

const mockFetch = (ok, json, jsonFails = false, status = ok ? 200 : 400) => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: jsonFails ? () => Promise.reject(new Error('bad')) : () => Promise.resolve(json),
  })
}

describe('apiHelper', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('menyimpan, membaca, dan menghapus token', () => {
    expect(getToken()).toBeNull()
    setToken('abc')
    expect(getToken()).toBe('abc')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('GET tanpa token & tanpa body', async () => {
    mockFetch(true, { status: 'success', message: 'ok', data: [1] })
    const res = await apiRequest('/api/public/posts')
    expect(res.data).toEqual([1])
    expect(fetch).toHaveBeenCalledWith('/api/public/posts', {
      method: 'GET',
      headers: {},
      body: undefined,
    })
  })

  it('POST dengan token & body JSON', async () => {
    setToken('tok')
    mockFetch(true, { status: 'success', message: 'ok' })
    await apiRequest('/api/posts', { method: 'POST', body: { a: 1 } })
    expect(fetch).toHaveBeenCalledWith('/api/posts', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
      body: '{"a":1}',
    })
  })

  it('melempar ApiError dengan pesan dari server', async () => {
    mockFetch(false, { status: 'fail', message: 'Salah' }, false, 401)
    const err = await apiRequest('/x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('Salah')
    expect(err.status).toBe(401)
  })

  it('pesan default bila respons bukan JSON', async () => {
    mockFetch(false, null, true, 500)
    await expect(apiRequest('/x')).rejects.toThrow('Terjadi kesalahan pada server')
  })

  it('melempar error bila status bukan success walau HTTP ok', async () => {
    mockFetch(true, { status: 'error', message: 'Gagal' })
    await expect(apiRequest('/x')).rejects.toThrow('Gagal')
  })

  it('melempar error bila jaringan gagal', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('net'))
    const err = await apiRequest('/x').catch((e) => e)
    expect(err.message).toBe('Tidak dapat terhubung ke server')
    expect(err.status).toBe(0)
  })
})
