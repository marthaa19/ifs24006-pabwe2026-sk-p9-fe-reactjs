import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StickyNavbar from './StickyNavbar'

describe('StickyNavbar', () => {
  it('tamu melihat Masuk & Daftar dan bisa berpindah halaman', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<StickyNavbar onNavigate={onNavigate} />)

    expect(screen.queryByRole('link', { name: 'Workspace' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Masuk' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/login')
    await user.click(screen.getByRole('link', { name: 'Daftar' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/register')
    await user.click(screen.getByRole('link', { name: /Delcom Blog/ }))
    expect(onNavigate).toHaveBeenLastCalledWith('/')
  })

  it('member melihat Workspace, nama, dan tombol Keluar (tanpa menu Admin)', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    const onLogout = vi.fn()
    render(<StickyNavbar user={{ username: 'budi', role: 'member' }} onNavigate={onNavigate} onLogout={onLogout} />)

    expect(screen.getByText('budi')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Masuk' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Workspace' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/author')
    await user.click(screen.getByRole('button', { name: 'Keluar' }))
    expect(onLogout).toHaveBeenCalled()
  })

  it('admin melihat menu Admin', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<StickyNavbar user={{ username: 'admin', role: 'admin' }} onNavigate={onNavigate} />)
    await user.click(screen.getByRole('link', { name: 'Admin' }))
    expect(onNavigate).toHaveBeenCalledWith('/admin')
  })

  it('tombol tema memanggil onToggleTheme (mode terang & gelap)', async () => {
    const user = userEvent.setup()
    const onToggleTheme = vi.fn()
    const { rerender } = render(<StickyNavbar onNavigate={vi.fn()} onToggleTheme={onToggleTheme} />)
    await user.click(screen.getByRole('button', { name: 'Ganti tema' }))
    rerender(<StickyNavbar dark onNavigate={vi.fn()} onToggleTheme={onToggleTheme} />)
    await user.click(screen.getByRole('button', { name: 'Ganti tema' }))
    expect(onToggleTheme).toHaveBeenCalledTimes(2)
  })
})
