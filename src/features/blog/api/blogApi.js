// API artikel: publik, milik penulis (CRUD, statistik), dan AI Generator.
import { apiRequest } from '../../../helpers/apiHelper'

// ---------- publik (tanpa login) ----------
export async function getPublicPosts({ q = '', category = '' } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category) params.set('category', category)
  const query = params.toString()
  const res = await apiRequest(`/api/public/posts${query ? `?${query}` : ''}`)
  return res.data || [] // backend bisa mengirim null saat kosong
}

export async function getPublicPost(slug) {
  const res = await apiRequest(`/api/public/posts/${encodeURIComponent(slug)}`)
  return res.data
}

// ---------- penulis (perlu login) ----------
export async function getMyPosts() {
  const res = await apiRequest('/api/posts')
  return res.data || []
}

export async function getMyStats() {
  const res = await apiRequest('/api/posts/stats')
  return res.data
}

export async function createPost(payload) {
  const res = await apiRequest('/api/posts', { method: 'POST', body: payload })
  return res.data
}

export async function updatePost(id, payload) {
  const res = await apiRequest(`/api/posts/${id}`, { method: 'PUT', body: payload })
  return res.data
}

export async function togglePublish(id) {
  const res = await apiRequest(`/api/posts/${id}/toggle-publish`, { method: 'PATCH' })
  return res.data
}

export async function deletePost(id) {
  await apiRequest(`/api/posts/${id}`, { method: 'DELETE' })
}

// ---------- AI Generator ----------
export async function generatePost({ topic, category, includeWebSearch }) {
  const res = await apiRequest('/api/posts/ai-generate', {
    method: 'POST',
    body: { topic, category, include_web_search: includeWebSearch },
  })
  return res.data
}
