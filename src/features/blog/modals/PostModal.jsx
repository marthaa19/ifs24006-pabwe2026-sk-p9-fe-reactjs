// Modal layar penuh untuk menulis / mengedit artikel (header & footer berwarna kontras).
import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import MarkdownEditor from '../../../components/MarkdownEditor'
import useInput from '../../../hooks/useInput'
import { showError, showSuccess } from '../../../helpers/toolsHelper'
import { createPost, updatePost } from '../api/blogApi'
import { CATEGORIES } from '../categories'

const EMPTY_POST = { title: '', category: 'Umum', excerpt: '', cover_image_path: '', content: '', is_published: false }
const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white'

export default function PostModal({ post = null, dark = false, onClose, onSaved }) {
  const isEdit = post !== null
  const init = post ?? EMPTY_POST
  const [title, onTitle] = useInput(init.title)
  const [category, onCategory] = useInput(init.category)
  const [excerpt, onExcerpt] = useInput(init.excerpt)
  const [cover, onCover] = useInput(init.cover_image_path)
  const [content, setContent] = useState(init.content)
  const [published, setPublished] = useState(init.is_published)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      showError('Judul dan konten artikel wajib diisi')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        category,
        excerpt,
        content,
        cover_image_path: cover,
        is_published: published,
      }
      if (isEdit) await updatePost(post.id, payload)
      else await createPost(payload)
      showSuccess(isEdit ? 'Artikel diperbarui' : 'Artikel dibuat')
      onSaved()
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit Artikel' : 'Tambah Artikel'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2"
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-[96vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <header className="flex items-center justify-between bg-indigo-700 px-6 py-4 text-white">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Artikel' : 'Tambah Artikel'}</h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="rounded p-1 hover:bg-indigo-600">
            <IconX size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6 dark:text-slate-200">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label htmlFor="post-title" className="mb-1 block text-sm font-medium">
                Judul
              </label>
              <input id="post-title" className={fieldClass} value={title} onChange={onTitle} required maxLength={255} />
            </div>
            <div>
              <label htmlFor="post-category" className="mb-1 block text-sm font-medium">
                Kategori
              </label>
              <select id="post-category" className={fieldClass} value={category} onChange={onCategory}>
                {CATEGORIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="post-excerpt" className="mb-1 block text-sm font-medium">
                Ringkasan
              </label>
              <textarea id="post-excerpt" rows={2} className={fieldClass} value={excerpt} onChange={onExcerpt} />
            </div>
            <div>
              <label htmlFor="post-cover" className="mb-1 block text-sm font-medium">
                URL Gambar Sampul
              </label>
              <input id="post-cover" className={fieldClass} value={cover} onChange={onCover} placeholder="https://..." />
            </div>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium">Konten (Markdown)</span>
            <MarkdownEditor value={content} onChange={setContent} height="480px" dark={dark} />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
            Terbitkan artikel ini
          </label>
        </div>

        <footer className="flex justify-end gap-3 bg-slate-100 px-6 py-4 dark:bg-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </footer>
      </form>
    </div>
  )
}
