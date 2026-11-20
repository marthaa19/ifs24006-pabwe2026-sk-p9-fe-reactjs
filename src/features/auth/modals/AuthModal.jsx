// Modal popup autentikasi: membungkus AuthPage (embedded). Render hanya saat dibutuhkan: {show && <AuthModal ... />}
import { useEffect, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import AuthPage from '../components/AuthPage'

export default function AuthModal({ mode = 'login', onClose, onSuccess }) {
  const [current, setCurrent] = useState(mode)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${current}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          aria-label="Tutup"
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={onClose}
        >
          <IconX size={20} />
        </button>
        <AuthPage key={current} mode={current} embedded onSuccess={onSuccess} onSwitchMode={setCurrent} />
      </div>
    </div>
  )
}
