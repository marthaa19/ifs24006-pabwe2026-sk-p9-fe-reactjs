import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import {
  createPost,
  deletePost,
  generatePost,
  getMyPosts,
  getMyStats,
  getPublicPost,
  getPublicPosts,
  togglePublish,
  updatePost,
} from './blogApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

describe('blogApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getPublicPosts tanpa parameter memanggil URL polos', async () => {
    apiRequest.mockResolvedValue({ data: [{ id: 1 }] })
    expect(await getPublicPosts()).toEqual([{ id: 1 }])
    expect(apiRequest).toHaveBeenCalledWith('/api/public/posts')
  })

  it('getPublicPosts menyusun query q & category', async () => {
    apiRequest.mockResolvedValue({ data: [] })
    await getPublicPosts({ q: 'go lang', category: 'Teknologi' })
    expect(apiRequest).toHaveBeenCalledWith('/api/public/posts?q=go+lang&category=Teknologi')
  })

  it('getPublicPosts hanya category / hanya kosong', async () => {
    apiRequest.mockResolvedValue({ data: [] })
    await getPublicPosts({ category: 'Bisnis' })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/public/posts?category=Bisnis')
    await getPublicPosts({ q: '', category: '' })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/public/posts')
  })

  it('getPublicPosts mengubah data null menjadi array kosong', async () => {
    apiRequest.mockResolvedValue({ data: null })
    expect(await getPublicPosts()).toEqual([])
  })

  it('getPublicPost memakai slug yang di-encode', async () => {
    apiRequest.mockResolvedValue({ data: { id: 2 } })
    expect(await getPublicPost('a b')).toEqual({ id: 2 })
    expect(apiRequest).toHaveBeenCalledWith('/api/public/posts/a%20b')
  })

  it('getMyPosts mengembalikan array (dan [] bila null)', async () => {
    apiRequest.mockResolvedValueOnce({ data: [{ id: 1 }] })
    expect(await getMyPosts()).toEqual([{ id: 1 }])
    expect(apiRequest).toHaveBeenCalledWith('/api/posts')
    apiRequest.mockResolvedValueOnce({ data: null })
    expect(await getMyPosts()).toEqual([])
  })

  it('getMyStats', async () => {
    apiRequest.mockResolvedValue({ data: { total: 3 } })
    expect(await getMyStats()).toEqual({ total: 3 })
    expect(apiRequest).toHaveBeenCalledWith('/api/posts/stats')
  })

  it('createPost & updatePost', async () => {
    apiRequest.mockResolvedValue({ data: { id: 5 } })
    expect(await createPost({ title: 'T' })).toEqual({ id: 5 })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/posts', { method: 'POST', body: { title: 'T' } })
    expect(await updatePost(5, { title: 'U' })).toEqual({ id: 5 })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/posts/5', { method: 'PUT', body: { title: 'U' } })
  })

  it('togglePublish & deletePost', async () => {
    apiRequest.mockResolvedValue({ data: { id: 5, is_published: true } })
    expect(await togglePublish(5)).toEqual({ id: 5, is_published: true })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/posts/5/toggle-publish', { method: 'PATCH' })
    expect(await deletePost(5)).toBeUndefined()
    expect(apiRequest).toHaveBeenLastCalledWith('/api/posts/5', { method: 'DELETE' })
  })

  it('generatePost mengirim include_web_search', async () => {
    apiRequest.mockResolvedValue({ data: { title: 'Draf' } })
    expect(await generatePost({ topic: 'AI', category: 'Teknologi', includeWebSearch: true })).toEqual({ title: 'Draf' })
    expect(apiRequest).toHaveBeenCalledWith('/api/posts/ai-generate', {
      method: 'POST',
      body: { topic: 'AI', category: 'Teknologi', include_web_search: true },
    })
  })
})
