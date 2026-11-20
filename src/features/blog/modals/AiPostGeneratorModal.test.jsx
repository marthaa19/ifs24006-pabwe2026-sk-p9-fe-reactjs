import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showError, showSuccess } from '../../../helpers/toolsHelper'
import { createPost, generatePost } from '../api/blogApi'
import AiPostGeneratorModal from './AiPostGeneratorModal'

vi.mock('../api/blogApi', () => ({ createPost: vi.fn(), generatePost: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({ showError: vi.fn(), showSuccess: vi.fn() }))
vi.mock('../../../components/MarkdownEditor', () => ({
  default: ({ value, onChange }) => (
    <textarea aria-label="Editor Markdown" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

const draft = (over = {}) => ({
  title: 'Draf AI',
  category: 'Teknologi',
  excerpt: 'Ringkasan AI',
  content: 'Isi AI',
  sources: [
    { title: 'Sumber 1', snippet: 's', url: 'https://a.test' },
    { title: 'Sumber 2', snippet: 's', url: 'https://b.test' },
  ],
  ...over,
})

async function generate(user, topic = 'Golang') {
  await user.type(screen.getByLabelText('Topik Artikel'), topic)
  await user.click(screen.getByRole('button', { name: 'Buat Draf' }))
}

describe('AiPostGeneratorModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('awalnya belum ada draf & tombol simpan nonaktif', () => {
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Simpan Draf' })).toBeDisabled()
    expect(screen.queryByLabelText('Judul')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Sertakan penelusuran web (Search Engine)')).toBeChecked()
  })

  it('menolak topik yang hanya spasi', async () => {
    const user = userEvent.setup()
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await generate(user, '   ')
    expect(showError).toHaveBeenCalledWith('Topik artikel wajib diisi')
    expect(generatePost).not.toHaveBeenCalled()
  })

  it('membuat draf dengan search engine & menampilkan sumber', async () => {
    const user = userEvent.setup()
    generatePost.mockResolvedValue(draft())
    render(<AiPostGeneratorModal dark onClose={vi.fn()} onSaved={vi.fn()} />)
    await generate(user)

    expect(await screen.findByLabelText('Judul')).toHaveValue('Draf AI')
    expect(screen.getByLabelText('Ringkasan')).toHaveValue('Ringkasan AI')
    expect(screen.getByLabelText('Editor Markdown')).toHaveValue('Isi AI')
    expect(screen.getByText('Teknologi', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sumber 1' })).toHaveAttribute('href', 'https://a.test')
    expect(screen.getByRole('link', { name: 'Sumber 2' })).toBeInTheDocument()
    expect(generatePost).toHaveBeenCalledWith({ topic: 'Golang', category: 'Umum', includeWebSearch: true })
    expect(screen.getByRole('button', { name: 'Simpan Draf' })).not.toBeDisabled()
  })

  it('opsi search engine & kategori dikirim sesuai pilihan', async () => {
    const user = userEvent.setup()
    generatePost.mockResolvedValue(draft({ sources: null }))
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText('Kategori'), 'Bisnis')
    await user.click(screen.getByLabelText('Sertakan penelusuran web (Search Engine)'))
    await generate(user, 'Startup')

    await screen.findByLabelText('Judul')
    expect(generatePost).toHaveBeenCalledWith({ topic: 'Startup', category: 'Bisnis', includeWebSearch: false })
    expect(screen.queryByText('Sumber dari Search Engine')).not.toBeInTheDocument()
  })

  it('draf tanpa sumber (array kosong) tidak menampilkan daftar sumber', async () => {
    const user = userEvent.setup()
    generatePost.mockResolvedValue(draft({ sources: [] }))
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await generate(user)
    await screen.findByLabelText('Judul')
    expect(screen.queryByText('Sumber dari Search Engine')).not.toBeInTheDocument()
  })

  it('menampilkan status "AI sedang menulis..." selama proses', async () => {
    const user = userEvent.setup()
    let resolve
    generatePost.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await generate(user)
    expect(screen.getByRole('button', { name: 'AI sedang menulis...' })).toBeDisabled()
    resolve(draft())
    await screen.findByLabelText('Judul')
    expect(screen.getByRole('button', { name: 'Buat Draf' })).not.toBeDisabled()
  })

  it('menampilkan error bila layanan AI gagal', async () => {
    const user = userEvent.setup()
    generatePost.mockRejectedValue(new Error('layanan AI sedang tidak tersedia'))
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await generate(user)
    await waitFor(() => expect(showError).toHaveBeenCalledWith('layanan AI sedang tidak tersedia'))
    expect(screen.queryByLabelText('Judul')).not.toBeInTheDocument()
  })

  it('menyimpan draf hasil edit sebagai draf (tidak terbit)', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    generatePost.mockResolvedValue(draft())
    createPost.mockResolvedValue({})
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={onSaved} />)
    await generate(user)

    await user.type(await screen.findByLabelText('Judul'), ' Revisi')
    await user.type(screen.getByLabelText('Ringkasan'), '!')
    await user.type(screen.getByLabelText('Editor Markdown'), ' tambahan')
    await user.click(screen.getByRole('button', { name: 'Simpan Draf' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(createPost).toHaveBeenCalledWith({
      title: 'Draf AI Revisi',
      category: 'Teknologi',
      excerpt: 'Ringkasan AI!',
      content: 'Isi AI tambahan',
      cover_image_path: '',
      is_published: false,
    })
    expect(showSuccess).toHaveBeenCalledWith('Draf artikel tersimpan')
  })

  it('error saat menyimpan & status "Menyimpan..."', async () => {
    const user = userEvent.setup()
    let reject
    generatePost.mockResolvedValue(draft())
    createPost.mockReturnValue(new Promise((_, r) => (reject = r)))
    render(<AiPostGeneratorModal onClose={vi.fn()} onSaved={vi.fn()} />)
    await generate(user)
    await screen.findByLabelText('Judul')
    await user.click(screen.getByRole('button', { name: 'Simpan Draf' }))
    expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    reject(new Error('Gagal simpan'))
    await waitFor(() => expect(showError).toHaveBeenCalledWith('Gagal simpan'))
    expect(screen.getByRole('button', { name: 'Simpan Draf' })).not.toBeDisabled()
  })

  it('tombol Batal dan Tutup memanggil onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AiPostGeneratorModal onClose={onClose} onSaved={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
