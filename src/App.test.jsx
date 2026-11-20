import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getProfile, logout } from './features/auth/api/authApi'

vi.mock('./features/auth/api/authApi', () => ({
  getProfile: vi.fn(),
  logout: vi.fn(),
}))

// Halaman anak diganti stub agar yang diuji hanya logika App (routing, sesi, penjaga rute).
vi.mock('./features/blog/components/PublicArticleList', () => ({
  default: ({ onOpenArticle }) => (
    <div>
      <p>DAFTAR ARTIKEL</p>
      <button onClick={() => onOpenArticle('halo-dunia')}>buka artikel</button>
    </div>
  ),
}))
vi.mock('./features/blog/components/PublicArticleDetail', () => ({
  default: ({ slug, dark, onBack }) => (
    <div>
      <p>DETAIL {slug}</p>
      <p>dark={String(dark)}</p>
      <button onClick={onBack}>kembali</button>
    </div>
  ),
}))
vi.mock('./features/blog/components/AuthorDashboard', () => ({
  default: ({ onNavigate }) => (
    <div>
      <p>WORKSPACE PENULIS</p>
      <button onClick={() => onNavigate('/posts/dari-workspace')}>lihat dari workspace</button>
    </div>
  ),
}))
vi.mock('./features/admin/components/AdminDashboard', () => ({
  default: () => <p>PANEL ADMIN</p>,
}))
vi.mock('./features/auth/components/AuthPage', () => ({
  default: ({ mode, onSuccess, onSwitchMode, onHome }) => (
    <div>
      <p>HALAMAN AUTH {mode}</p>
      <button onClick={() => onSuccess({ username: 'budi', role: 'member' })}>sukses member</button>
      <button onClick={() => onSuccess({ username: 'root', role: 'admin' })}>sukses admin</button>
      <button onClick={() => onSwitchMode('register')}>ke register</button>
      <button onClick={onHome}>ke beranda</button>
    </div>
  ),
}))
vi.mock('./features/auth/modals/AuthModal', () => ({
  default: ({ onClose, onSuccess }) => (
    <div role="dialog">
      <p>MODAL LOGIN</p>
      <button onClick={onClose}>tutup modal</button>
      <button onClick={() => onSuccess({ username: 'budi', role: 'member' })}>modal sukses member</button>
      <button onClick={() => onSuccess({ username: 'root', role: 'admin' })}>modal sukses admin</button>
    </div>
  ),
}))

const member = { username: 'budi', role: 'member' }
const admin = { username: 'root', role: 'admin' }
const apiError = (status) => Object.assign(new Error('gagal'), { status })

// Membuka aplikasi seolah-olah pengguna mengetik `path` di address bar (opsional: sudah punya token).
function open(path, { token = false } = {}) {
  window.history.replaceState(null, '', path)
  if (token) localStorage.setItem('token', 'token-uji')
  return render(<App />)
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear() // token & tema dari tes sebelumnya tidak boleh bocor
    document.documentElement.classList.remove('dark')
    window.history.replaceState(null, '', '/')
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    logout.mockResolvedValue(undefined)
  })

  describe('routing & URL', () => {
    it('"/" dan "/public" menampilkan daftar artikel', () => {
      const first = open('/')
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
      expect(document.title).toBe('Delcom Blog')
      first.unmount()

      open('/public')
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
    })

    it('garis miring di akhir path diabaikan', () => {
      open('/public/')
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
    })

    it('klik artikel membuka /posts/:slug, tombol kembali pulang ke "/"', async () => {
      const user = userEvent.setup()
      open('/')
      await user.click(screen.getByText('buka artikel'))
      expect(window.location.pathname).toBe('/posts/halo-dunia')
      expect(screen.getByText('DETAIL halo-dunia')).toBeInTheDocument()
      expect(document.title).toBe('Baca Artikel - Delcom Blog')
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0)

      await user.click(screen.getByText('kembali'))
      expect(window.location.pathname).toBe('/')
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
    })

    it('slug di URL didekode (%20 menjadi spasi)', () => {
      open('/posts/halo%20dunia')
      expect(screen.getByText('DETAIL halo dunia')).toBeInTheDocument()
    })

    it.each([['/tidak-ada'], ['/posts/'], ['/posts/%E0%A4%A']])('%s menampilkan halaman 404', async (path) => {
      const user = userEvent.setup()
      open(path)
      expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
      expect(document.title).toBe('Halaman Tidak Ditemukan - Delcom Blog')

      await user.click(screen.getByRole('button', { name: 'Kembali ke beranda' }))
      expect(window.location.pathname).toBe('/')
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
    })

    it('tombol Back/Forward peramban (popstate) mengikuti URL', () => {
      open('/')
      act(() => {
        window.history.pushState(null, '', '/login')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(screen.getByText('HALAMAN AUTH login')).toBeInTheDocument()
    })

    it('halaman login/register: pindah mode dan kembali ke beranda', async () => {
      const user = userEvent.setup()
      open('/login')
      expect(document.title).toBe('Masuk - Delcom Blog')

      await user.click(screen.getByText('ke register'))
      expect(window.location.pathname).toBe('/register')
      expect(screen.getByText('HALAMAN AUTH register')).toBeInTheDocument()
      expect(document.title).toBe('Daftar - Delcom Blog')

      await user.click(screen.getByText('ke beranda'))
      expect(window.location.pathname).toBe('/')
    })

    it('tautan navbar memakai navigasi SPA & tombol tema mengubah prop dark', async () => {
      const user = userEvent.setup()
      open('/posts/abc')
      expect(screen.getByText('dark=false')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Ganti tema' }))
      expect(screen.getByText('dark=true')).toBeInTheDocument()
      expect(document.documentElement).toHaveClass('dark')

      await user.click(screen.getByRole('link', { name: 'Masuk' }))
      expect(window.location.pathname).toBe('/login')
      await user.click(screen.getByRole('link', { name: 'Daftar' }))
      expect(window.location.pathname).toBe('/register')
      await user.click(screen.getByRole('link', { name: /Delcom Blog/ }))
      expect(window.location.pathname).toBe('/')
    })
  })

  describe('sesi login', () => {
    it('tanpa token: profil tidak dipanggil dan pengunjung dianggap tamu', () => {
      open('/')
      expect(getProfile).not.toHaveBeenCalled()
      expect(screen.getByRole('link', { name: 'Masuk' })).toBeInTheDocument()
    })

    it('ada token: tampil "Memuat sesi..." lalu pengguna dipulihkan tanpa modal', async () => {
      getProfile.mockResolvedValue(member)
      open('/author', { token: true })

      expect(screen.getByRole('status')).toHaveTextContent('Memuat sesi...')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(await screen.findByText('WORKSPACE PENULIS')).toBeInTheDocument()
      expect(screen.getByText('budi')).toBeInTheDocument()
      expect(window.location.pathname).toBe('/author')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('token kedaluwarsa (401): token dibuang dan tamu di halaman terjaga diberi modal', async () => {
      getProfile.mockRejectedValue(apiError(401))
      open('/author', { token: true })

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(localStorage.getItem('token')).toBeNull()
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
    })

    it('server tidak terjangkau (bukan 401): token tetap disimpan', async () => {
      getProfile.mockRejectedValue(apiError(0))
      open('/', { token: true })

      expect(await screen.findByText('DAFTAR ARTIKEL')).toBeInTheDocument()
      expect(localStorage.getItem('token')).toBe('token-uji')
    })

    it('Keluar memanggil logout, mengosongkan user, dan pulang ke "/"', async () => {
      const user = userEvent.setup()
      getProfile.mockResolvedValue(member)
      open('/author', { token: true })
      await screen.findByText('WORKSPACE PENULIS')

      await user.click(screen.getByRole('button', { name: 'Keluar' }))
      expect(logout).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(window.location.pathname).toBe('/'))
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Masuk' })).toBeInTheDocument()
    })

    it('berhasil login di /login: user dipulihkan lalu dialihkan sesuai peran', async () => {
      const user = userEvent.setup()
      open('/login')
      await user.click(screen.getByText('sukses member'))
      expect(await screen.findByText('WORKSPACE PENULIS')).toBeInTheDocument()
      expect(window.location.pathname).toBe('/author')
    })
  })

  describe('penjaga rute', () => {
    it('tamu di /author: AuthModal muncul di atas beranda; menutupnya pulang ke "/"', async () => {
      const user = userEvent.setup()
      open('/author')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('DAFTAR ARTIKEL')).toBeInTheDocument()
      expect(screen.queryByText('WORKSPACE PENULIS')).not.toBeInTheDocument()
      expect(window.location.pathname).toBe('/author')

      await user.click(screen.getByText('tutup modal'))
      expect(window.location.pathname).toBe('/')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('tamu di /admin yang login sebagai admin lewat modal masuk ke panel admin', async () => {
      const user = userEvent.setup()
      open('/admin')
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByText('modal sukses admin'))
      expect(screen.getByText('PANEL ADMIN')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(window.location.pathname).toBe('/admin')
      expect(document.title).toBe('Panel Admin - Delcom Blog')
    })

    it('tamu di /admin yang login sebagai member dialihkan ke /author', async () => {
      const user = userEvent.setup()
      open('/admin')
      await user.click(screen.getByText('modal sukses member'))
      expect(screen.getByText('WORKSPACE PENULIS')).toBeInTheDocument()
      expect(window.location.pathname).toBe('/author')
    })

    it('member yang membuka /admin dialihkan ke /author (replace, tanpa modal)', async () => {
      getProfile.mockResolvedValue(member)
      open('/admin', { token: true })
      expect(await screen.findByText('WORKSPACE PENULIS')).toBeInTheDocument()
      expect(window.location.pathname).toBe('/author')
      expect(screen.queryByText('PANEL ADMIN')).not.toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('admin boleh membuka /admin dan /author; menu Admin muncul di navbar', async () => {
      const user = userEvent.setup()
      getProfile.mockResolvedValue(admin)
      open('/admin', { token: true })
      expect(await screen.findByText('PANEL ADMIN')).toBeInTheDocument()

      await user.click(screen.getByRole('link', { name: 'Workspace' }))
      expect(screen.getByText('WORKSPACE PENULIS')).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'Admin' }))
      expect(screen.getByText('PANEL ADMIN')).toBeInTheDocument()
    })

    it('Workspace dapat membuka artikel lewat onNavigate', async () => {
      const user = userEvent.setup()
      getProfile.mockResolvedValue(member)
      open('/author', { token: true })
      await user.click(await screen.findByText('lihat dari workspace'))
      expect(window.location.pathname).toBe('/posts/dari-workspace')
      expect(screen.getByText('DETAIL dari-workspace')).toBeInTheDocument()
    })

    it.each([
      ['/login', member, '/author', 'WORKSPACE PENULIS'],
      ['/register', admin, '/admin', 'PANEL ADMIN'],
    ])('user yang sudah login membuka %s dialihkan ke halaman utamanya', async (path, profile, target, text) => {
      getProfile.mockResolvedValue(profile)
      open(path, { token: true })
      expect(await screen.findByText(text)).toBeInTheDocument()
      expect(window.location.pathname).toBe(target)
      expect(screen.queryByText(/HALAMAN AUTH/)).not.toBeInTheDocument()
    })
  })
})
