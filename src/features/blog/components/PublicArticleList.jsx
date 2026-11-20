// Galeri artikel publik: pencarian real-time + filter kategori berbentuk pill.
import { useEffect, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { formatDate } from '../../../helpers/toolsHelper'
import { getPublicPosts } from '../api/blogApi'
import { CATEGORIES } from '../categories'

const FILTERS = ['Semua', ...CATEGORIES]

export default function PublicArticleList({ onOpenArticle }) {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Semua')
  // hasil disimpan bersama kuncinya; "loading" = hasil yang ada belum untuk kueri saat ini
  const [result, setResult] = useState({ key: null, posts: [], error: '' })
  const key = `${q}|${category}`

  useEffect(() => {
    let cancelled = false
    const params = { q, category: category === 'Semua' ? '' : category }
    getPublicPosts(params)
      .then((posts) => {
        if (!cancelled) setResult({ key: `${q}|${category}`, posts, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: `${q}|${category}`, posts: [], error: err.message })
      })
    return () => {
      cancelled = true // abaikan respons kueri lama (mis. saat pengguna masih mengetik)
    }
  }, [q, category])

  const loading = result.key !== key

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Artikel Terbaru</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Bacaan pilihan dari para penulis Delcom Blog.</p>
      </section>

      <div className="relative mx-auto mb-5 max-w-xl">
        <IconSearch size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          aria-label="Cari artikel"
          placeholder="Cari artikel..."
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="w-full rounded-full border border-slate-300 bg-white py-2 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            onClick={() => setCategory(name)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === name
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-slate-500">Memuat artikel...</p>}
      {!loading && result.error && <p className="text-center text-red-600">{result.error}</p>}
      {!loading && !result.error && result.posts.length === 0 && (
        <p className="text-center text-slate-500">Belum ada artikel yang cocok.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {!loading &&
          result.posts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              {post.cover_image_path && (
                <img src={post.cover_image_path} alt={post.title} className="h-44 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <span className="w-fit rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                  {post.category}
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  <button type="button" className="text-left hover:underline" onClick={() => onOpenArticle(post.slug)}>
                    {post.title}
                  </button>
                </h2>
                {post.excerpt && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>}
                <p className="mt-auto pt-4 text-xs text-slate-500 dark:text-slate-400">
                  {post.author.username} · {formatDate(post.published_at)} · {post.reading_time} menit baca
                </p>
              </div>
            </article>
          ))}
      </div>
    </main>
  )
}
