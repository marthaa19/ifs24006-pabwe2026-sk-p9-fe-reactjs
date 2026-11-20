// Komponen induk SPA: routing sinkron dengan URL (pushState + popstate), pemulihan sesi login
// setelah refresh, penjaga rute berdasarkan peran, dan AuthModal untuk pengunjung yang belum login.
import { useCallback, useEffect, useState } from 'react'
import useTheme from './hooks/useTheme'
import { clearToken, getToken } from './helpers/apiHelper'
import { getProfile, logout } from './features/auth/api/authApi'
import AuthPage from './features/auth/components/AuthPage'
import AuthModal from './features/auth/modals/AuthModal'
import StickyNavbar from './features/blog/components/StickyNavbar'
import PublicArticleList from './features/blog/components/PublicArticleList'
import PublicArticleDetail from './features/blog/components/PublicArticleDetail'
import AuthorDashboard from './features/blog/components/AuthorDashboard'
import AdminDashboard from './features/admin/components/AdminDashboard'

// Judul tab peramban untuk tiap halaman.
const TITLES = {
  home: 'Delcom Blog',
  detail: 'Baca Artikel - Delcom Blog',
  author: 'Workspace Penulis - Delcom Blog',
  admin: 'Panel Admin - Delcom Blog',
  login: 'Masuk - Delcom Blog',
  register: 'Daftar - Delcom Blog',
  notfound: 'Halaman Tidak Ditemukan - Delcom Blog',
}

// "/author/" -> "/author", "/" tetap "/".
const normalizePath = (pathname) => pathname.replace(/(.)\/+$/, '$1')

// Slug dari URL bisa berisi %XX; URL rusak (mis. "%E0%A4%A") tidak boleh membuat aplikasi crash.
function safeDecode(text) {
  try {
    return decodeURIComponent(text)
  } catch {
    return null
  }
}

// Menerjemahkan path menjadi nama halaman: { name, slug? }.
function resolveRoute(path) {
  if (path === '/' || path === '/public') return { name: 'home' }
  if (path.startsWith('/posts/')) {
    const slug = safeDecode(path.slice('/posts/'.length))
    return slug ? { name: 'detail', slug } : { name: 'notfound' }
  }
  if (['/author', '/admin', '/login', '/register'].includes(path)) return { name: path.slice(1) }
  return { name: 'notfound' }
}

// Admin mendarat di panel admin, penulis biasa di workspace.
const homeFor = (user) => (user.role === 'admin' ? '/admin' : '/author')

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  const [path, setPath] = useState(() => normalizePath(window.location.pathname))
  const [user, setUser] = useState(null)
  // Jika ada token tersimpan, tahan render halaman terjaga sampai profil selesai diverifikasi.
  const [booting, setBooting] = useState(() => Boolean(getToken()))

  // Pindah halaman: ubah URL peramban + state. replace=true menimpa riwayat (dipakai untuk redirect).
  const navigate = useCallback((to, { replace = false } = {}) => {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', to)
    setPath(normalizePath(to))
    window.scrollTo(0, 0)
  }, [])

  // Tombol Back/Forward peramban.
  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Pulihkan sesi setelah refresh: token valid -> ambil profil; token kedaluwarsa (401) -> buang.
  useEffect(() => {
    if (!getToken()) return
    getProfile()
      .then(setUser)
      .catch((err) => {
        if (err.status === 401) clearToken()
      })
      .finally(() => setBooting(false))
  }, [])

  // Penjaga rute dihitung saat render (tanpa setState di effect):
  // pengguna yang sudah login tidak perlu /login atau /register, dan non-admin tidak boleh masuk /admin.
  const requested = resolveRoute(path)
  let redirectTo = null
  if (user && (requested.name === 'login' || requested.name === 'register')) redirectTo = homeFor(user)
  else if (user && requested.name === 'admin' && user.role !== 'admin') redirectTo = '/author'
  const route = redirectTo ? resolveRoute(redirectTo) : requested
  // Pengunjung (belum login) yang membuka halaman terjaga akan diberi AuthModal.
  const needsLogin = !user && (route.name === 'author' || route.name === 'admin')

  // Effect hanya menyelaraskan URL peramban dengan halaman yang benar-benar tampil (replace: tanpa jejak Back).
  useEffect(() => {
    if (redirectTo) window.history.replaceState(null, '', redirectTo)
  }, [redirectTo])

  useEffect(() => {
    document.title = TITLES[route.name]
  }, [route.name])

  const handleLogout = async () => {
    await logout()
    setUser(null)
    navigate('/')
  }
  const openArticle = (slug) => navigate(`/posts/${slug}`)
  const closeLoginModal = useCallback(() => navigate('/', { replace: true }), [navigate])

  const showLoginModal = !booting && needsLogin

  let page
  if (booting) {
    page = (
      <p role="status" className="p-8 text-center text-slate-500 dark:text-slate-400">
        Memuat sesi...
      </p>
    )
  } else if (needsLogin) {
    // Tampilkan beranda di belakang modal, bukan layar kosong.
    page = <PublicArticleList onOpenArticle={openArticle} />
  } else {
    switch (route.name) {
      case 'home':
        page = <PublicArticleList onOpenArticle={openArticle} />
        break
      case 'detail':
        page = <PublicArticleDetail slug={route.slug} dark={dark} onBack={() => navigate('/')} />
        break
      case 'author':
        page = <AuthorDashboard dark={dark} onNavigate={navigate} />
        break
      case 'admin':
        page = <AdminDashboard onNavigate={navigate} />
        break
      case 'login':
      case 'register':
        page = (
          <div className="flex justify-center px-4 py-10">
            <AuthPage
              key={route.name}
              mode={route.name}
              embedded
              onSuccess={setUser}
              onSwitchMode={(mode) => navigate(`/${mode}`)}
              onHome={() => navigate('/')}
            />
          </div>
        )
        break
      default:
        page = (
          <main className="mx-auto max-w-md px-4 py-20 text-center">
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white">404</h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400">Halaman tidak ditemukan.</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Kembali ke beranda
            </button>
          </main>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <StickyNavbar user={user} dark={dark} onToggleTheme={toggleTheme} onNavigate={navigate} onLogout={handleLogout} />
      {page}
      {showLoginModal && <AuthModal mode="login" onClose={closeLoginModal} onSuccess={setUser} />}
    </div>
  )
}
