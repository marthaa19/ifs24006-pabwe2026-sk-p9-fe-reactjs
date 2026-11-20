import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import { getAdminPosts, getAdminUsers } from './adminApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

describe('adminApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAdminUsers mengembalikan daftar (dan [] bila null)', async () => {
    apiRequest.mockResolvedValueOnce({ data: [{ id: 1 }] })
    expect(await getAdminUsers()).toEqual([{ id: 1 }])
    expect(apiRequest).toHaveBeenCalledWith('/api/admin/users')
    apiRequest.mockResolvedValueOnce({ data: null })
    expect(await getAdminUsers()).toEqual([])
  })

  it('getAdminPosts mengembalikan daftar (dan [] bila null)', async () => {
    apiRequest.mockResolvedValueOnce({ data: [{ id: 2 }] })
    expect(await getAdminPosts()).toEqual([{ id: 2 }])
    expect(apiRequest).toHaveBeenCalledWith('/api/admin/posts')
    apiRequest.mockResolvedValueOnce({ data: null })
    expect(await getAdminPosts()).toEqual([])
  })
})
