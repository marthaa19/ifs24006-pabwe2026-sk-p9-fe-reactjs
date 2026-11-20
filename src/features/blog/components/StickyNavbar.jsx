// Navbar sticky di bagian atas (tanpa sidebar). Tautan memakai href asli + navigasi SPA.
import { IconBook, IconMoon, IconSun } from '@tabler/icons-react'

const linkClass = 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'

export default function StickyNavbar({ user = null, dark = false, onToggleTheme, onNavigate, onLogout }) {
  const go = (path) => (event) => {
    event.preventDefault()
    onNavigate(path)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <nav className="flex w-full items-center justify-between gap-3 px-6 py-3">
        <a href="/" onClick={go('/')} className="flex items-center gap-2 text-lg font-bold text-indigo-600">
          <IconBook size={24} /> Delcom Blog
        </a>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            aria-label="Ganti tema"
            onClick={onToggleTheme}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>

          {user ? (
            <>
              <a href="/author" onClick={go('/author')} className={linkClass}>
                Workspace
              </a>
              {user.role === 'admin' && (
                <a href="/admin" onClick={go('/admin')} className={linkClass}>
                  Admin
                </a>
              )}
              <span className="px-2 text-sm text-slate-500 dark:text-slate-400">{user.username}</span>
              <button type="button" onClick={onLogout} className={linkClass}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <a href="/login" onClick={go('/login')} className={linkClass}>
                Masuk
              </a>
              <a
                href="/register"
                onClick={go('/register')}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Daftar
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
