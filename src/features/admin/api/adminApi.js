// API khusus admin: direktori pengguna & seluruh artikel.
import { apiRequest } from '../../../helpers/apiHelper'

export async function getAdminUsers() {
  const res = await apiRequest('/api/admin/users')
  return res.data || []
}

export async function getAdminPosts() {
  const res = await apiRequest('/api/admin/posts')
  return res.data || []
}
