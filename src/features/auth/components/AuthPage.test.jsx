import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showError } from '../../../helpers/toolsHelper'
import { login, register } from '../api/authApi'
import AuthPage from './AuthPage'

vi.mock('../api/authApi', () => ({ login: vi.fn(), register: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({ showError: vi.fn() }))

describe('AuthPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('judul punya id sesuai mode agar bisa menjadi nama dialog (aria-labelledby)', () => {
    const { rerender } = render(<AuthPage onSuccess={vi.fn()} onSwitchMode={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'login-title')
    rerender(<AuthPage mode="register" onSuccess={vi.fn()} onSwitchMode={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'register-title')
  })

  it('mode login: id wajib tersedia & submit memanggil login', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    login.mockResolvedValue({ id: 1 })
    const { container } = render(<AuthPage onSuccess={onSuccess} onSwitchMode={vi.fn()} />)

    expect(container.querySelector('#login-username')).toBeInTheDocument()
    expect(container.querySelector('#login-password')).toBeInTheDocument()
    expect(container.querySelector('#login-submit')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Username atau Email'), 'admin')
    await user.type(screen.getByLabelText('Password'), 'admin')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 1 }))
    expect(login).toHaveBeenCalledWith('admin', 'admin')
  })

  it('menampilkan error saat login gagal', async () => {
    const user = userEvent.setup()
    login.mockRejectedValue(new Error('Username atau password salah'))
    render(<AuthPage onSuccess={vi.fn()} onSwitchMode={vi.fn()} />)

    await user.type(screen.getByLabelText('Username atau Email'), 'x')
    await user.type(screen.getByLabelText('Password'), 'y')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() => expect(showError).toHaveBeenCalledWith('Username atau password salah'))
    expect(screen.getByRole('button', { name: 'Masuk' })).not.toBeDisabled()
  })

  it('tombol nonaktif & berlabel "Memproses..." selama loading', async () => {
    const user = userEvent.setup()
    let resolve
    login.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<AuthPage onSuccess={vi.fn()} onSwitchMode={vi.fn()} />)

    await user.type(screen.getByLabelText('Username atau Email'), 'a')
    await user.type(screen.getByLabelText('Password'), 'b')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled()
    resolve({ id: 1 })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Masuk' })).not.toBeDisabled())
  })

  it('mode register: tiga field & submit memanggil register', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    register.mockResolvedValue({ id: 2 })
    render(<AuthPage mode="register" onSuccess={onSuccess} onSwitchMode={vi.fn()} />)

    await user.type(screen.getByLabelText('Username'), 'budi')
    await user.type(screen.getByLabelText('Email'), 'budi@mail.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia')
    await user.click(screen.getByRole('button', { name: 'Daftar' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 2 }))
    expect(register).toHaveBeenCalledWith('budi', 'budi@mail.com', 'rahasia')
  })

  it('tautan pindah mode memanggil onSwitchMode', async () => {
    const user = userEvent.setup()
    const onSwitchMode = vi.fn()
    const { rerender } = render(<AuthPage onSuccess={vi.fn()} onSwitchMode={onSwitchMode} />)
    await user.click(screen.getByRole('button', { name: 'Daftar sekarang' }))
    expect(onSwitchMode).toHaveBeenLastCalledWith('register')

    rerender(<AuthPage mode="register" onSuccess={vi.fn()} onSwitchMode={onSwitchMode} />)
    await user.click(screen.getByRole('button', { name: 'Masuk di sini' }))
    expect(onSwitchMode).toHaveBeenLastCalledWith('login')
  })

  it('tombol beranda hanya tampil bila onHome diberikan', async () => {
    const user = userEvent.setup()
    const onHome = vi.fn()
    const { rerender } = render(<AuthPage onSuccess={vi.fn()} onSwitchMode={vi.fn()} />)
    expect(screen.queryByText('← Kembali ke beranda')).not.toBeInTheDocument()

    rerender(<AuthPage onSuccess={vi.fn()} onSwitchMode={vi.fn()} onHome={onHome} />)
    await user.click(screen.getByText('← Kembali ke beranda'))
    expect(onHome).toHaveBeenCalled()
  })

  it('embedded tidak memakai pembungkus layar penuh', () => {
    const { container, rerender } = render(<AuthPage onSuccess={vi.fn()} onSwitchMode={vi.fn()} />)
    expect(container.firstChild.className).toContain('min-h-screen')
    rerender(<AuthPage embedded onSuccess={vi.fn()} onSwitchMode={vi.fn()} />)
    expect(container.firstChild.className).not.toContain('min-h-screen')
  })
})
