// Custom hook tema gelap/terang & aksen warna, disimpan di localStorage.
import { useEffect, useState } from 'react'

export const ACCENTS = ['indigo', 'emerald', 'rose', 'amber']

const read = (key, fallback) => localStorage.getItem(key) || fallback

export default function useTheme() {
  const [theme, setTheme] = useState(() =>
    read('theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )
  const [accent, setAccent] = useState(() => read('accent', 'indigo'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.accent = accent
    localStorage.setItem('accent', accent)
  }, [accent])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggleTheme, accent, setAccent }
}
