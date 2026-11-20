import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicPost } from '../api/blogApi'
import PublicArticleDetail from './PublicArticleDetail'

vi.mock('../api/blogApi', () => ({ getPublicPost: vi.fn() }))
vi.mock('../../../components/MarkdownViewer', () => ({
  default: ({ content, dark }) => <div data-testid="viewer">{`${content}|${dark}`}</div>,
}))

const post = (over = {}) => ({
  id: 1,
  title: 'Judul Detail',
  slug: 'judul-detail',
  category: 'Teknologi',
  content: '# Isi',
  cover_image_path: '',
  published_at: '2026-11-19T10:00:00Z',
  reading_time: 4,
  author: { id: 1, username: 'penulis1' },
  ...over,
})

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('PublicArticleDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan loading lalu artikel lengkap (tanpa sampul, tema terang)', async () => {
    getPublicPost.mockResolvedValue(post())
    render(<PublicArticleDetail slug="judul-detail" onBack={vi.fn()} />)

    expect(screen.getByText('Memuat artikel...')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Judul Detail' })).toBeInTheDocument()
    expect(screen.getByText(/Oleh penulis1 · .* · 4 menit baca/)).toBeInTheDocument()
    expect(screen.getByTestId('viewer')).toHaveTextContent('# Isi|false')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(getPublicPost).toHaveBeenCalledWith('judul-detail')
  })

  it('menampilkan gambar sampul & meneruskan tema gelap ke viewer', async () => {
    getPublicPost.mockResolvedValue(post({ cover_image_path: 'https://x.test/c.jpg' }))
    render(<PublicArticleDetail slug="s" dark onBack={vi.fn()} />)
    expect(await screen.findByRole('img', { name: 'Judul Detail' })).toHaveAttribute('src', 'https://x.test/c.jpg')
    expect(screen.getByTestId('viewer')).toHaveTextContent('# Isi|true')
  })

  it('menampilkan pesan error bila artikel tidak ditemukan', async () => {
    getPublicPost.mockRejectedValue(new Error('Artikel tidak ditemukan'))
    render(<PublicArticleDetail slug="x" onBack={vi.fn()} />)
    expect(await screen.findByText('Artikel tidak ditemukan')).toBeInTheDocument()
    expect(screen.queryByTestId('viewer')).not.toBeInTheDocument()
  })

  it('tombol kembali memanggil onBack', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    getPublicPost.mockResolvedValue(post())
    render(<PublicArticleDetail slug="s" onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /Kembali ke daftar artikel/ }))
    expect(onBack).toHaveBeenCalled()
  })

  it('berganti slug memuat artikel baru', async () => {
    getPublicPost.mockResolvedValueOnce(post({ title: 'Satu' })).mockResolvedValueOnce(post({ title: 'Dua' }))
    const { rerender } = render(<PublicArticleDetail slug="satu" onBack={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Satu' })
    rerender(<PublicArticleDetail slug="dua" onBack={vi.fn()} />)
    expect(screen.getByText('Memuat artikel...')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Dua' })).toBeInTheDocument()
  })

  it('mengabaikan respons lama (sukses & gagal) setelah slug berganti', async () => {
    const d1 = deferred()
    const d2 = deferred()
    const d3 = deferred()
    getPublicPost.mockReturnValueOnce(d1.promise).mockReturnValueOnce(d2.promise).mockReturnValueOnce(d3.promise)
    const { rerender } = render(<PublicArticleDetail slug="a" onBack={vi.fn()} />)
    rerender(<PublicArticleDetail slug="b" onBack={vi.fn()} />)
    rerender(<PublicArticleDetail slug="c" onBack={vi.fn()} />)

    d3.resolve(post({ title: 'Terbaru' }))
    await screen.findByRole('heading', { name: 'Terbaru' })
    await act(async () => d1.resolve(post({ title: 'Lama' })))
    await act(async () => d2.reject(new Error('Galat lama')))
    expect(screen.queryByText('Lama')).not.toBeInTheDocument()
    expect(screen.queryByText('Galat lama')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Terbaru' })).toBeInTheDocument()
  })
})
