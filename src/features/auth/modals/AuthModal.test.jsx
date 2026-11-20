import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthModal from './AuthModal'

vi.mock('../components/AuthPage', () => ({
  default: ({ mode, embedded, onSuccess, onSwitchMode }) => (
    <div data-testid="page">
      <span data-testid="mode">{mode}</span>
      <span data-testid="embedded">{String(embedded)}</span>
      <button onClick={() => onSuccess({ id: 1 })}>sukses</button>
      <button onClick={() => onSwitchMode('register')}>pindah</button>
    </div>
  ),
}))

describe('AuthModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan dialog dengan AuthPage embedded mode login (default)', () => {
    render(<AuthModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('mode')).toHaveTextContent('login')
    expect(screen.getByTestId('embedded')).toHaveTextContent('true')
  })

  it('menerima mode awal register', () => {
    render(<AuthModal mode="register" onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('mode')).toHaveTextContent('register')
  })

  it('meneruskan onSuccess & berpindah mode', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<AuthModal onClose={vi.fn()} onSuccess={onSuccess} />)
    await user.click(screen.getByText('sukses'))
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 })
    await user.click(screen.getByText('pindah'))
    expect(screen.getByTestId('mode')).toHaveTextContent('register')
  })

  it('tombol tutup & klik latar memanggil onClose, klik isi tidak', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} onSuccess={vi.fn()} />)
    await user.click(screen.getByLabelText('Tutup'))
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(2)
    await user.click(screen.getByTestId('page'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('tombol Escape menutup, tombol lain tidak', () => {
    const onClose = vi.fn()
    const { unmount } = render(<AuthModal onClose={onClose} onSuccess={vi.fn()} />)
    fireEvent.keyDown(window, { key: 'a' })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
