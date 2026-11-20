// Form login & register. Dipakai sebagai halaman mandiri (/login, /register) dan di dalam AuthModal (embedded).
import { useState } from 'react'
import useInput from '../../../hooks/useInput'
import { showError } from '../../../helpers/toolsHelper'
import { login, register } from '../api/authApi'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white'

export default function AuthPage({ mode = 'login', onSuccess, onSwitchMode, onHome, embedded = false }) {
  const isLogin = mode === 'login'
  const prefix = isLogin ? 'login' : 'register'
  const [username, onUsername] = useInput()
  const [email, onEmail] = useInput()
  const [password, onPassword] = useInput()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const user = isLogin ? await login(username, password) : await register(username, email, password)
      onSuccess(user)
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const card = (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
      <h1 id={`${prefix}-title`} className="text-2xl font-bold text-slate-900 dark:text-white">
        {isLogin ? 'Masuk ke Delcom Blog' : 'Buat Akun Penulis'}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {isLogin ? 'Kelola artikel dan gunakan AI Generator.' : 'Daftar gratis dan mulai menulis.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor={`${prefix}-username`} className="mb-1 block text-sm font-medium dark:text-slate-200">
            {isLogin ? 'Username atau Email' : 'Username'}
          </label>
          <input
            id={`${prefix}-username`}
            className={inputClass}
            value={username}
            onChange={onUsername}
            required
            minLength={isLogin ? undefined : 3}
          />
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm font-medium dark:text-slate-200">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={onEmail}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor={`${prefix}-password`} className="mb-1 block text-sm font-medium dark:text-slate-200">
            Password
          </label>
          <input
            id={`${prefix}-password`}
            type="password"
            className={inputClass}
            value={password}
            onChange={onPassword}
            required
            minLength={isLogin ? undefined : 5}
          />
        </div>

        <button
          id={`${prefix}-submit`}
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
        {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
        <button
          type="button"
          className="font-semibold text-indigo-600 hover:underline"
          onClick={() => onSwitchMode(isLogin ? 'register' : 'login')}
        >
          {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
        </button>
      </p>

      {onHome && (
        <button
          type="button"
          className="mt-3 block w-full text-center text-sm text-slate-500 hover:underline"
          onClick={onHome}
        >
          ← Kembali ke beranda
        </button>
      )}
    </div>
  )

  if (embedded) return card
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      {card}
    </div>
  )
}
