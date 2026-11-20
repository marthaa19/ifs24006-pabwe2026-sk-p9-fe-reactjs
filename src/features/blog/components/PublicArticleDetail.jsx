// Halaman baca artikel (layout lebar penuh) dengan isi Markdown.
import { useEffect, useState } from 'react'
import MarkdownViewer from '../../../components/MarkdownViewer'
import { formatDate } from '../../../helpers/toolsHelper'
import { getPublicPost } from '../api/blogApi'

export default function PublicArticleDetail({ slug, dark = false, onBack }) {
  const [result, setResult] = useState({ slug: null, post: null, error: '' })

  useEffect(() => {
    let cancelled = false
    getPublicPost(slug)
      .then((post) => {
        if (!cancelled) setResult({ slug, post, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ slug, post: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const { post, error } = result
  const loading = result.slug !== slug

  return (
    <main className="mx-auto w-full max-w-[96vw] px-4 py-8">
      <button type="button" onClick={onBack} className="mb-6 text-sm font-medium text-indigo-600 hover:underline">
        ← Kembali ke daftar artikel
      </button>

      {loading && <p className="text-slate-500">Memuat artikel...</p>}
      {!loading && error && <p className="text-red-600">{error}</p>}

      {!loading && post && (
        <article>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
            {post.category}
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">{post.title}</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Oleh {post.author.username} · {formatDate(post.published_at)} · {post.reading_time} menit baca
          </p>
          {post.cover_image_path && (
            <img src={post.cover_image_path} alt={post.title} className="mt-6 max-h-[28rem] w-full rounded-2xl object-cover" />
          )}
          <div className="mt-8 rounded-2xl bg-white p-6 dark:bg-slate-800">
            <MarkdownViewer content={post.content} dark={dark} />
          </div>
        </article>
      )}
    </main>
  )
}
