// Modal layar penuh AI Blog Generator: topik -> (opsional) penelusuran search engine -> draf yang bisa diedit -> simpan.
import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import MarkdownEditor from '../../../components/MarkdownEditor'
import useInput from '../../../hooks/useInput'
import { showError, showSuccess } from '../../../helpers/toolsHelper'
import { createPost, generatePost } from '../api/blogApi'
import { CATEGORIES } from '../categories'

const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white'

export default function AiPostGeneratorModal({ dark = false, onClose, onSaved }) {
  const [topic, onTopic] = useInput()
  const [category, onCategory] = useInput('Umum')
  const [webSearch, setWebSearch] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  const patchDraft = (changes) => setDraft((d) => ({ ...d, ...changes }))

  async function handleGenerate(event) {
    event.preventDefault()
    if (!topic.trim()) {
      showError('Topik artikel wajib diisi')
      return
    }
    setGenerating(true)
    try {
      setDraft(await generatePost({ topic: topic.trim(), category, includeWebSearch: webSearch }))
    } catch (err) {
      showError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await createPost({
        title: draft.title,
        category: draft.category,
        excerpt: draft.excerpt,
        content: draft.content,
        cover_image_path: '',
        is_published: false,
      })
      showSuccess('Draf artikel tersimpan')
      onSaved()
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const sources = draft?.sources || []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Generator"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2"
    >
      <div className="flex h-[96vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex items-center justify-between bg-emerald-700 px-6 py-4 text-white">
          <h2 className="text-lg font-bold">AI Blog Generator</h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="rounded p-1 hover:bg-emerald-600">
            <IconX size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 dark:text-slate-200">
          <form onSubmit={handleGenerate} className="grid items-end gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label htmlFor="ai-topic" className="mb-1 block text-sm font-medium">
                Topik Artikel
              </label>
              <input
                id="ai-topic"
                className={fieldClass}
                value={topic}
                onChange={onTopic}
                placeholder="mis. Manfaat belajar Golang untuk pemula"
                required
              />
            </div>
            <div>
              <label htmlFor="ai-category" className="mb-1 block text-sm font-medium">
                Kategori
              </label>
              <select id="ai-category" className={fieldClass} value={category} onChange={onCategory}>
                {CATEGORIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={generating}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {generating ? 'AI sedang menulis...' : 'Buat Draf'}
            </button>
            <label className="flex items-center gap-2 text-sm md:col-span-4">
              <input type="checkbox" checked={webSearch} onChange={(event) => setWebSearch(event.target.checked)} />
              Sertakan penelusuran web (Search Engine)
            </label>
          </form>

          {draft && (
            <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-700">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label htmlFor="draft-title" className="mb-1 block text-sm font-medium">
                    Judul
                  </label>
                  <input
                    id="draft-title"
                    className={fieldClass}
                    value={draft.title}
                    onChange={(event) => patchDraft({ title: event.target.value })}
                  />
                </div>
                <p className="self-end text-sm">
                  Kategori hasil AI: <strong>{draft.category}</strong>
                </p>
              </div>
              <div>
                <label htmlFor="draft-excerpt" className="mb-1 block text-sm font-medium">
                  Ringkasan
                </label>
                <textarea
                  id="draft-excerpt"
                  rows={2}
                  className={fieldClass}
                  value={draft.excerpt}
                  onChange={(event) => patchDraft({ excerpt: event.target.value })}
                />
              </div>
              <div>
                <span className="mb-1 block text-sm font-medium">Konten (Markdown)</span>
                <MarkdownEditor
                  value={draft.content}
                  onChange={(content) => patchDraft({ content })}
                  height="420px"
                  dark={dark}
                />
              </div>
              {sources.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium">Sumber dari Search Engine</p>
                  <ul className="list-disc pl-5 text-sm">
                    {sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
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
            type="button"
            onClick={handleSave}
            disabled={!draft || saving}
            className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Draf'}
          </button>
        </footer>
      </div>
    </div>
  )
}
