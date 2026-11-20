import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicPosts } from '../api/blogApi'
import PublicArticleList from './PublicArticleList'

vi.mock('../api/blogApi', () => ({ getPublicPosts: vi.fn() }))

const post = (over = {}) => ({
  id: 1,
  title: 'Judul A',
  slug: 'judul-a',
  category: 'Teknologi',
  excerpt: 'Ringkasan A',
  cover_image_path: '',
  published_at: '2026-11-19T10:00:00Z',
  reading_time: 3,
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

describe('PublicArticleList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan loading lalu kartu artikel (dengan & tanpa sampul/ringkasan)', async () => {
    getPublicPosts.mockResolvedValue([
      post({ cover_image_path: 'https://x.test/a.jpg' }),
      post({ id: 2, title: 'Judul B', slug: 'judul-b', excerpt: '', cover_image_path: '' }),
    ])
    render(<PublicArticleList onOpenArticle={vi.fn()} />)

    expect(screen.getByText('Memuat artikel...')).toBeInTheDocument()
    expect(await screen.findByText('Judul A')).toBeInTheDocument()
    expect(screen.getByText('Judul B')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Judul A' })).toHaveAttribute('src', 'https://x.test/a.jpg')
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByText('Ringkasan A')).toBeInTheDocument()
    expect(screen.getAllByText(/penulis1 · .* · 3 menit baca/)).toHaveLength(2)
    expect(getPublicPosts).toHaveBeenCalledWith({ q: '', category: '' })
  })

  it('klik judul membuka artikel', async () => {
    const user = userEvent.setup()
    const onOpenArticle = vi.fn()
    getPublicPosts.mockResolvedValue([post()])
    render(<PublicArticleList onOpenArticle={onOpenArticle} />)
    await user.click(await screen.findByRole('button', { name: 'Judul A' }))
    expect(onOpenArticle).toHaveBeenCalledWith('judul-a')
  })

  it('menampilkan pesan bila tidak ada artikel', async () => {
    getPublicPosts.mockResolvedValue([])
    render(<PublicArticleList onOpenArticle={vi.fn()} />)
    expect(await screen.findByText('Belum ada artikel yang cocok.')).toBeInTheDocument()
  })

  it('menampilkan pesan error dari server', async () => {
    getPublicPosts.mockRejectedValue(new Error('Server mati'))
    render(<PublicArticleList onOpenArticle={vi.fn()} />)
    expect(await screen.findByText('Server mati')).toBeInTheDocument()
    expect(screen.queryByText('Belum ada artikel yang cocok.')).not.toBeInTheDocument()
  })

  it('pencarian real-time mengirim kata kunci ke API', async () => {
    const user = userEvent.setup()
    getPublicPosts.mockResolvedValue([])
    render(<PublicArticleList onOpenArticle={vi.fn()} />)
    await user.type(screen.getByLabelText('Cari artikel'), 'go')
    expect(getPublicPosts).toHaveBeenLastCalledWith({ q: 'go', category: '' })
    await screen.findByText('Belum ada artikel yang cocok.')
  })

  it('filter kategori mengirim kategori & "Semua" menghapusnya', async () => {
    const user = userEvent.setup()
    getPublicPosts.mockResolvedValue([])
    render(<PublicArticleList onOpenArticle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Semua' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Bisnis' }))
    expect(getPublicPosts).toHaveBeenLastCalledWith({ q: '', category: 'Bisnis' })
    expect(screen.getByRole('button', { name: 'Bisnis' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Semua' }))
    expect(getPublicPosts).toHaveBeenLastCalledWith({ q: '', category: '' })
    await screen.findByText('Belum ada artikel yang cocok.')
  })

  it('mengabaikan respons lama yang sukses setelah kueri berganti', async () => {
    const user = userEvent.setup()
    const d1 = deferred()
    const d2 = deferred()
    getPublicPosts.mockReturnValueOnce(d1.promise).mockReturnValueOnce(d2.promise)
    render(<PublicArticleList onOpenArticle={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Opini' }))

    d2.resolve([post({ title: 'Hasil Baru' })])
    expect(await screen.findByText('Hasil Baru')).toBeInTheDocument()
    await act(async () => d1.resolve([post({ id: 9, title: 'Hasil Lama' })]))
    expect(screen.queryByText('Hasil Lama')).not.toBeInTheDocument()
    expect(screen.getByText('Hasil Baru')).toBeInTheDocument()
  })

  it('mengabaikan respons lama yang gagal setelah kueri berganti', async () => {
    const user = userEvent.setup()
    const d1 = deferred()
    const d2 = deferred()
    getPublicPosts.mockReturnValueOnce(d1.promise).mockReturnValueOnce(d2.promise)
    render(<PublicArticleList onOpenArticle={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Opini' }))

    d2.resolve([post({ title: 'Hasil Baru' })])
    await screen.findByText('Hasil Baru')
    await act(async () => d1.reject(new Error('Galat lama')))
    expect(screen.queryByText('Galat lama')).not.toBeInTheDocument()
  })
})
