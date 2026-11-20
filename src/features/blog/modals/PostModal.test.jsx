import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showError, showSuccess } from '../../../helpers/toolsHelper'
import { createPost, updatePost } from '../api/blogApi'
import PostModal from './PostModal'

vi.mock('../api/blogApi', () => ({ createPost: vi.fn(), updatePost: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({ showError: vi.fn(), showSuccess: vi.fn() }))
vi.mock('../../../components/MarkdownEditor', () => ({
  default: ({ value, onChange }) => (
    <textarea aria-label="Editor Markdown" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

const existing = {
  id: 7,
  title: 'Judul Lama',
  category: 'Opini',
  excerpt: 'Ringkasan lama',
  cover_image_path: 'https://x.test/lama.jpg',
  content: 'Isi lama',
  is_published: true,
}

describe('PostModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mode tambah: form kosong, lalu menyimpan lewat createPost', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    createPost.mockResolvedValue({})
    render(<PostModal onClose={vi.fn()} onSaved={onSaved} />)

    expect(screen.getByRole('heading', { name: 'Tambah Artikel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveValue('')
    expect(screen.getByLabelText('Kategori')).toHaveValue('Umum')

    await user.type(screen.getByLabelText('Judul'), '  Judul Baru ')
    await user.selectOptions(screen.getByLabelText('Kategori'), 'Bisnis')
    await user.type(screen.getByLabelText('Ringkasan'), 'Ringkas')
    await user.type(screen.getByLabelText('URL Gambar Sampul'), 'https://x.test/y.jpg')
    await user.type(screen.getByLabelText('Editor Markdown'), 'Isi artikel')
    await user.click(screen.getByLabelText('Terbitkan artikel ini'))
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(createPost).toHaveBeenCalledWith({
      title: 'Judul Baru',
      category: 'Bisnis',
      excerpt: 'Ringkas',
      content: 'Isi artikel',
      cover_image_path: 'https://x.test/y.jpg',
      is_published: true,
    })
    expect(showSuccess).toHaveBeenCalledWith('Artikel dibuat')
  })

  it('mode edit: terisi data lama, menyimpan lewat updatePost', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    updatePost.mockResolvedValue({})
    render(<PostModal post={existing} dark onClose={vi.fn()} onSaved={onSaved} />)

    expect(screen.getByRole('heading', { name: 'Edit Artikel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveValue('Judul Lama')
    expect(screen.getByLabelText('Kategori')).toHaveValue('Opini')
    expect(screen.getByLabelText('Editor Markdown')).toHaveValue('Isi lama')
    expect(screen.getByLabelText('Terbitkan artikel ini')).toBeChecked()

    await user.clear(screen.getByLabelText('Judul'))
    await user.type(screen.getByLabelText('Judul'), 'Judul Baru')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(updatePost).toHaveBeenCalledWith(7, {
      title: 'Judul Baru',
      category: 'Opini',
      excerpt: 'Ringkasan lama',
      content: 'Isi lama',
      cover_image_path: 'https://x.test/lama.jpg',
      is_published: true,
    })
    expect(createPost).not.toHaveBeenCalled()
    expect(showSuccess).toHaveBeenCalledWith('Artikel diperbarui')
  })

  it('menolak judul yang hanya spasi', async () => {
    const user = userEvent.setup()
    render(<PostModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.type(screen.getByLabelText('Judul'), '   ')
    await user.type(screen.getByLabelText('Editor Markdown'), 'isi')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(showError).toHaveBeenCalledWith('Judul dan konten artikel wajib diisi')
    expect(createPost).not.toHaveBeenCalled()
  })

  it('menolak konten kosong', async () => {
    const user = userEvent.setup()
    render(<PostModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.type(screen.getByLabelText('Judul'), 'Ada judul')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(showError).toHaveBeenCalledWith('Judul dan konten artikel wajib diisi')
    expect(createPost).not.toHaveBeenCalled()
  })

  it('menampilkan error dari server & tombol aktif kembali', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    createPost.mockRejectedValue(new Error('Kategori tidak valid'))
    render(<PostModal onClose={vi.fn()} onSaved={onSaved} />)
    await user.type(screen.getByLabelText('Judul'), 'J')
    await user.type(screen.getByLabelText('Editor Markdown'), 'K')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(showError).toHaveBeenCalledWith('Kategori tidak valid'))
    expect(onSaved).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Simpan' })).not.toBeDisabled()
  })

  it('tombol "Menyimpan..." nonaktif selama proses', async () => {
    const user = userEvent.setup()
    let resolve
    createPost.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<PostModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.type(screen.getByLabelText('Judul'), 'J')
    await user.type(screen.getByLabelText('Editor Markdown'), 'K')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    resolve({})
    await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan' })).not.toBeDisabled())
  })

  it('tombol Batal dan Tutup memanggil onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PostModal onClose={onClose} onSaved={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
