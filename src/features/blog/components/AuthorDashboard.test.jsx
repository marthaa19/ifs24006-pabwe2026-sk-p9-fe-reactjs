import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showConfirm, showError, showSuccess } from '../../../helpers/toolsHelper'
import { deletePost, getMyPosts, getMyStats, togglePublish } from '../api/blogApi'
import AuthorDashboard from './AuthorDashboard'

vi.mock('../api/blogApi', () => ({
  getMyPosts: vi.fn(),
  getMyStats: vi.fn(),
  togglePublish: vi.fn(),
  deletePost: vi.fn(),
}))
vi.mock('../../../helpers/toolsHelper', () => ({
  formatDate: (v) => `tgl:${v}`,
  showConfirm: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
vi.mock('../modals/PostModal', () => ({
  default: ({ post, onClose, onSaved }) => (
    <div data-testid="post-modal">
      <span>{post ? `edit:${post.title}` : 'baru'}</span>
      <button onClick={onSaved}>simpan-modal</button>
      <button onClick={onClose}>tutup-modal</button>
    </div>
  ),
}))
vi.mock('../modals/AiPostGeneratorModal', () => ({
  default: ({ onClose, onSaved }) => (
    <div data-testid="ai-modal">
      <button onClick={onSaved}>simpan-ai</button>
      <button onClick={onClose}>tutup-ai</button>
    </div>
  ),
}))

const published = { id: 1, title: 'Artikel Terbit', slug: 'artikel-terbit', category: 'Teknologi', is_published: true, updated_at: 'U1' }
const draftPost = { id: 2, title: 'Artikel Draf', slug: 'artikel-draf', category: 'Umum', is_published: false, updated_at: 'U2' }
const stats = { total: 5, total_published: 3, total_draft: 2 }

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const setup = (props = {}) => {
  getMyPosts.mockResolvedValue([published, draftPost])
  getMyStats.mockResolvedValue(stats)
  return render(<AuthorDashboard onNavigate={vi.fn()} {...props} />)
}

describe('AuthorDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan loading, lalu statistik & tabel artikel', async () => {
    setup({ dark: true })
    expect(screen.getByText('Memuat artikel...')).toBeInTheDocument()
    expect(await screen.findByText('Artikel Terbit')).toBeInTheDocument()
    expect(screen.getByText('Artikel Draf')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('tgl:U1')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Terbitkan Artikel Terbit' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: 'Terbitkan Artikel Draf' })).toHaveAttribute('aria-checked', 'false')
  })

  it('menampilkan pesan bila belum ada artikel', async () => {
    getMyPosts.mockResolvedValue([])
    getMyStats.mockResolvedValue({ total: 0, total_published: 0, total_draft: 0 })
    render(<AuthorDashboard onNavigate={vi.fn()} />)
    expect(await screen.findByText('Belum ada artikel. Mulai menulis sekarang!')).toBeInTheDocument()
  })

  it('menampilkan pesan error', async () => {
    getMyPosts.mockRejectedValue(new Error('Token tidak valid'))
    getMyStats.mockResolvedValue(stats)
    render(<AuthorDashboard onNavigate={vi.fn()} />)
    expect(await screen.findByText('Token tidak valid')).toBeInTheDocument()
    expect(screen.queryByText('Belum ada artikel. Mulai menulis sekarang!')).not.toBeInTheDocument()
  })

  it('toggle terbit/draf memanggil API lalu memuat ulang', async () => {
    const user = userEvent.setup()
    setup()
    togglePublish.mockResolvedValue({})
    await user.click(await screen.findByRole('switch', { name: 'Terbitkan Artikel Draf' }))
    expect(togglePublish).toHaveBeenCalledWith(2)
    await waitFor(() => expect(getMyPosts).toHaveBeenCalledTimes(2))
  })

  it('toggle gagal menampilkan error', async () => {
    const user = userEvent.setup()
    setup()
    togglePublish.mockRejectedValue(new Error('Tidak diizinkan'))
    await user.click(await screen.findByRole('switch', { name: 'Terbitkan Artikel Draf' }))
    await waitFor(() => expect(showError).toHaveBeenCalledWith('Tidak diizinkan'))
  })

  it('menu kebab: buka, tutup lewat tombol & lewat overlay', async () => {
    const user = userEvent.setup()
    setup()
    const kebab = await screen.findByRole('button', { name: 'Menu aksi Artikel Draf' })
    await user.click(kebab)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(kebab)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(kebab)
    await user.click(screen.getByTestId('menu-overlay'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('menu "Lihat" hanya untuk artikel terbit dan menavigasi ke detail', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    setup({ onNavigate })

    await user.click(await screen.findByRole('button', { name: 'Menu aksi Artikel Draf' }))
    expect(within(screen.getByRole('menu')).queryByRole('menuitem', { name: 'Lihat' })).not.toBeInTheDocument()
    await user.click(screen.getByTestId('menu-overlay'))

    await user.click(screen.getByRole('button', { name: 'Menu aksi Artikel Terbit' }))
    await user.click(screen.getByRole('menuitem', { name: 'Lihat' }))
    expect(onNavigate).toHaveBeenCalledWith('/posts/artikel-terbit')
  })

  it('Edit membuka modal berisi artikel; simpan menutup & memuat ulang', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: 'Menu aksi Artikel Draf' }))
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(screen.getByText('edit:Artikel Draf')).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(screen.getByText('simpan-modal'))
    expect(screen.queryByTestId('post-modal')).not.toBeInTheDocument()
    await waitFor(() => expect(getMyPosts).toHaveBeenCalledTimes(2))
  })

  it('Tambah Artikel membuka modal kosong & bisa ditutup', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: /Tambah Artikel/ }))
    expect(screen.getByText('baru')).toBeInTheDocument()
    await user.click(screen.getByText('tutup-modal'))
    expect(screen.queryByTestId('post-modal')).not.toBeInTheDocument()
  })

  it('AI Generator membuka modal; simpan menutup & memuat ulang; bisa ditutup', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: /AI Generator/ }))
    await user.click(screen.getByText('tutup-ai'))
    expect(screen.queryByTestId('ai-modal')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /AI Generator/ }))
    await user.click(screen.getByText('simpan-ai'))
    expect(screen.queryByTestId('ai-modal')).not.toBeInTheDocument()
    await waitFor(() => expect(getMyPosts).toHaveBeenCalledTimes(2))
  })

  it('Hapus: dikonfirmasi -> hapus, notifikasi, muat ulang', async () => {
    const user = userEvent.setup()
    setup()
    showConfirm.mockResolvedValue(true)
    deletePost.mockResolvedValue()
    await user.click(await screen.findByRole('button', { name: 'Menu aksi Artikel Draf' }))
    await user.click(screen.getByRole('menuitem', { name: 'Hapus' }))

    expect(showConfirm).toHaveBeenCalledWith('Hapus artikel "Artikel Draf"?', 'Ya, hapus')
    await waitFor(() => expect(deletePost).toHaveBeenCalledWith(2))
    expect(showSuccess).toHaveBeenCalledWith('Artikel dihapus')
    await waitFor(() => expect(getMyPosts).toHaveBeenCalledTimes(2))
  })

  it('Hapus: dibatalkan -> tidak ada yang dihapus', async () => {
    const user = userEvent.setup()
    setup()
    showConfirm.mockResolvedValue(false)
    await user.click(await screen.findByRole('button', { name: 'Menu aksi Artikel Draf' }))
    await user.click(screen.getByRole('menuitem', { name: 'Hapus' }))
    await waitFor(() => expect(showConfirm).toHaveBeenCalled())
    expect(deletePost).not.toHaveBeenCalled()
  })

  it('Hapus gagal menampilkan error', async () => {
    const user = userEvent.setup()
    setup()
    showConfirm.mockResolvedValue(true)
    deletePost.mockRejectedValue(new Error('Artikel tidak ditemukan'))
    await user.click(await screen.findByRole('button', { name: 'Menu aksi Artikel Draf' }))
    await user.click(screen.getByRole('menuitem', { name: 'Hapus' }))
    await waitFor(() => expect(showError).toHaveBeenCalledWith('Artikel tidak ditemukan'))
  })

  it('mengabaikan hasil yang tiba setelah komponen dilepas (sukses & gagal)', async () => {
    const ok = deferred()
    getMyPosts.mockReturnValueOnce(ok.promise)
    getMyStats.mockResolvedValueOnce(stats)
    const first = render(<AuthorDashboard onNavigate={vi.fn()} />)
    first.unmount()
    await act(async () => ok.resolve([published]))

    const bad = deferred()
    getMyPosts.mockReturnValueOnce(bad.promise)
    getMyStats.mockResolvedValueOnce(stats)
    const second = render(<AuthorDashboard onNavigate={vi.fn()} />)
    second.unmount()
    await act(async () => bad.reject(new Error('terlambat')))
    expect(getMyPosts).toHaveBeenCalledTimes(2)
  })
})
