import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useTheme from './useTheme'

const setPrefersDark = (matches) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches })
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    delete document.documentElement.dataset.accent
  })

  it('default light & aksen indigo bila tidak ada preferensi', () => {
    setPrefersDark(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(result.current.accent).toBe('indigo')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.accent).toBe('indigo')
  })

  it('mengikuti preferensi sistem gelap', () => {
    setPrefersDark(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('memakai nilai dari localStorage', () => {
    setPrefersDark(true)
    localStorage.setItem('theme', 'light')
    localStorage.setItem('accent', 'rose')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(result.current.accent).toBe('rose')
  })

  it('toggleTheme bolak-balik & setAccent mengganti aksen', () => {
    setPrefersDark(false)
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    act(() => result.current.setAccent('emerald'))
    expect(document.documentElement.dataset.accent).toBe('emerald')
  })
})
