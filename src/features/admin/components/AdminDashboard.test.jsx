import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminPosts, getAdminUsers } from '../api/adminApi'
import AdminDashboard from './AdminDashboard'

vi.mock('../api/adminApi', () => ({ getAdminUsers: vi.fn(), getAdminPosts: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({ formatDate: (v) => `tgl:${v}` }))

const users = [
  { id: 1, username: 'admin', email: 'admin@delcom.org', role: 'admin', total_posts: 0, total_published: 0, created_at: 'C1' },
  { id: 2, username: 'member', email: 'member@delcom.org', role: 'member', total_posts: 2, total_published: 1, created_at: 'C2' },
]
const posts = [
  { id: 10, title: 'Panduan Go', slug: 'panduan-go', category: 'Teknologi', is_published: true, updated_at: 'U1', author: { id: 2, username: 'member' } },
  { id: 11, title: 'Catatan Rahasia', slug: 'catatan-rahasia', category: 'Umum', is_published: false, updated_at: 'U2', author: { id: 2, username: 'member' } },
]

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('AdminDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan loading, lalu statistik & dua tabel', async () => {
    getAdminUsers.mockResolvedValue(users)
    getAdminPosts.mockResolvedValue(posts)
    render(<AdminDashboard onNavigate={vi.fn()} />)

    expect(screen.getByText('Memuat data...')).toBeInTheDocument()
    expect(await screen.findByText('Direktori Pengguna')).toBeInTheDocument()

    expect(screen.getByText('Total Pengguna').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Total Artikel').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Artikel Terbit').nextSibling).toHaveTextContent('1')

    const memberRow = screen.getByText('member@delcom.org').closest('tr')
    expect(within(memberRow).getByText('member', { selector: 'td' })).toBeInTheDocument()
    expect(screen.getByText('admin@delcom.org')).toBeInTheDocument()
    expect(screen.getByText('tgl:C1')).toBeInTheDocument()

    expect(screen.getByText('Panduan Go')).toBeInTheDocument()
    expect(screen.getByText('Catatan Rahasia')).toBeInTheDocument()
    expect(screen.getByText('Draf', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Terbit', { selector: 'span' })).toBeInTheDocument()
  })

  it('tombol Lihat hanya untuk artikel terbit dan menavigasi ke detail', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    getAdminUsers.mockResolvedValue(users)
    getAdminPosts.mockResolvedValue(posts)
    render(<AdminDashboard onNavigate={onNavigate} />)

    await user.click(await screen.findByRole('button', { name: 'Lihat Panduan Go' }))
    expect(onNavigate).toHaveBeenCalledWith('/posts/panduan-go')
    expect(screen.queryByRole('button', { name: 'Lihat Catatan Rahasia' })).not.toBeInTheDocument()
  })

  it('menampilkan pesan bila pengguna & artikel kosong', async () => {
    getAdminUsers.mockResolvedValue([])
    getAdminPosts.mockResolvedValue([])
    render(<AdminDashboard onNavigate={vi.fn()} />)
    expect(await screen.findByText('Belum ada pengguna.')).toBeInTheDocument()
    expect(screen.getByText('Belum ada artikel.')).toBeInTheDocument()
  })

  it('menampilkan pesan error (mis. bukan admin)', async () => {
    getAdminUsers.mockRejectedValue(new Error('Akses ditolak'))
    getAdminPosts.mockResolvedValue(posts)
    render(<AdminDashboard onNavigate={vi.fn()} />)
    expect(await screen.findByText('Akses ditolak')).toBeInTheDocument()
    expect(screen.queryByText('Direktori Pengguna')).not.toBeInTheDocument()
  })

  it('mengabaikan hasil yang tiba setelah komponen dilepas (sukses & gagal)', async () => {
    const ok = deferred()
    getAdminUsers.mockReturnValueOnce(ok.promise)
    getAdminPosts.mockResolvedValueOnce(posts)
    render(<AdminDashboard onNavigate={vi.fn()} />).unmount()
    await act(async () => ok.resolve(users))

    const bad = deferred()
    getAdminUsers.mockReturnValueOnce(bad.promise)
    getAdminPosts.mockResolvedValueOnce(posts)
    render(<AdminDashboard onNavigate={vi.fn()} />).unmount()
    await act(async () => bad.reject(new Error('terlambat')))
    expect(getAdminUsers).toHaveBeenCalledTimes(2)
  })
})
