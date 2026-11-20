// SEMENTARA: demo gabungan Langkah 3-7. Akan diganti routing SPA sungguhan di Langkah 8.
import { useState } from 'react'
import useTheme from './hooks/useTheme'
import AuthPage from './features/auth/components/AuthPage'
import StickyNavbar from './features/blog/components/StickyNavbar'
import PublicArticleList from './features/blog/components/PublicArticleList'
import PublicArticleDetail from './features/blog/components/PublicArticleDetail'
import AuthorDashboard from './features/blog/components/AuthorDashboard'
import AdminDashboard from './features/admin/components/AdminDashboard'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [path, setPath] = useState('/')
  const [user, setUser] = useState(null)
  const dark = theme === 'dark'

  let page
  if (path === '/login' || path === '/register') {
    page = (
      <AuthPage
        key={path}
        mode={path === '/login' ? 'login' : 'register'}
        embedded
        onSuccess={(u) => {
          setUser(u)
          setPath('/author')
        }}
        onSwitchMode={(m) => setPath(`/${m}`)}
      />
    )
  } else if (path.startsWith('/posts/')) {
    page = <PublicArticleDetail slug={path.slice(7)} dark={dark} onBack={() => setPath('/')} />
  } else if (path === '/author') {
    page = user ? (
      <AuthorDashboard dark={dark} onNavigate={setPath} />
    ) : (
      <p className="p-8">Silakan masuk dulu.</p>
    )
  } else if (path === '/admin') {
    page = user?.role === 'admin' ? <AdminDashboard onNavigate={setPath} /> : <p className="p-8">Khusus admin.</p>
  } else if (path === '/') {
    page = <PublicArticleList onOpenArticle={(slug) => setPath(`/posts/${slug}`)} />
  } else {
    page = <p className="p-8">Halaman {path} belum dibuat (menyusul di langkah berikutnya).</p>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <StickyNavbar user={user} dark={dark} onToggleTheme={toggleTheme} onNavigate={setPath} onLogout={() => setUser(null)} />
      {page}
    </div>
  )
}
