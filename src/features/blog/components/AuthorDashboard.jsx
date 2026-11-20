// Workspace penulis (lebar penuh): statistik, tabel artikel, menu kebab, toggle terbit/draf.
import { useEffect, useState } from 'react'
import { IconDotsVertical, IconPlus, IconSparkles } from '@tabler/icons-react'
import { formatDate, showConfirm, showError, showSuccess } from '../../../helpers/toolsHelper'
import { deletePost, getMyPosts, getMyStats, togglePublish } from '../api/blogApi'
import AiPostGeneratorModal from '../modals/AiPostGeneratorModal'
import PostModal from '../modals/PostModal'
import PostStats from './PostStats'

const EMPTY_VIEW = { posts: [], stats: { total: 0, total_published: 0, total_draft: 0 }, error: '' }

export default function AuthorDashboard({ dark = false, onNavigate }) {
  const [data, setData] = useState(null) // null = sedang memuat pertama kali
  const [version, setVersion] = useState(0) // naikkan untuk memuat ulang
  const [modal, setModal] = useState(null) // null | { kind: 'post', post } | { kind: 'ai' }
  const [menuId, setMenuId] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getMyPosts(), getMyStats()])
      .then(([posts, stats]) => {
        if (!cancelled) setData({ posts, stats, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setData({ ...EMPTY_VIEW, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const reload = () => setVersion((v) => v + 1)
  const { posts, stats, error } = data ?? EMPTY_VIEW
  const loading = data === null

  async function handleToggle(post) {
    try {
      await togglePublish(post.id)
      reload()
    } catch (err) {
      showError(err.message)
    }
  }

  async function handleDelete(post) {
    setMenuId(null)
    if (!(await showConfirm(`Hapus artikel "${post.title}"?`, 'Ya, hapus'))) return
    try {
      await deletePost(post.id)
      showSuccess('Artikel dihapus')
      reload()
    } catch (err) {
      showError(err.message)
    }
  }

  const openPostModal = (post) => {
    setMenuId(null)
    setModal({ kind: 'post', post })
  }
  const handleSaved = () => {
    setModal(null)
    reload()
  }

  return (
    <main className="w-full px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Penulis</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModal({ kind: 'ai' })}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <IconSparkles size={18} /> AI Generator
          </button>
          <button
            type="button"
            onClick={() => openPostModal(null)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <IconPlus size={18} /> Tambah Artikel
          </button>
        </div>
      </div>

      <PostStats total={stats.total} published={stats.total_published} draft={stats.total_draft} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {loading && <p className="p-6 text-slate-500">Memuat artikel...</p>}
        {!loading && error && <p className="p-6 text-red-600">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="p-6 text-slate-500">Belum ada artikel. Mulai menulis sekarang!</p>
        )}

        {posts.length > 0 && (
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Terbit</th>
                  <th className="px-4 py-3">Diperbarui</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{post.title}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{post.category}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={post.is_published}
                        aria-label={`Terbitkan ${post.title}`}
                        onClick={() => handleToggle(post)}
                        className={`relative h-6 w-11 rounded-full transition ${
                          post.is_published ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            post.is_published ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(post.updated_at)}</td>
                    <td className="relative px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Menu aksi ${post.title}`}
                        onClick={() => setMenuId(menuId === post.id ? null : post.id)}
                        className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <IconDotsVertical size={20} />
                      </button>
                      {menuId === post.id && (
                        <>
                          <div data-testid="menu-overlay" className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                          <div
                            role="menu"
                            className="absolute right-4 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-600 dark:bg-slate-700"
                          >
                            {post.is_published && (
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600"
                                onClick={() => onNavigate(`/posts/${post.slug}`)}
                              >
                                Lihat
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              className="block w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600"
                              onClick={() => openPostModal(post)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="block w-full px-4 py-2 text-left text-red-600 hover:bg-slate-100 dark:hover:bg-slate-600"
                              onClick={() => handleDelete(post)}
                            >
                              Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.kind === 'post' && (
        <PostModal post={modal.post} dark={dark} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.kind === 'ai' && (
        <AiPostGeneratorModal dark={dark} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
    </main>
  )
}
