// Panel admin (lebar penuh): statistik, direktori pengguna, dan seluruh artikel dari semua penulis.
import { useEffect, useState } from 'react'
import { formatDate } from '../../../helpers/toolsHelper'
import { getAdminPosts, getAdminUsers } from '../api/adminApi'

const EMPTY_VIEW = { users: [], posts: [], error: '' }
const th = 'px-4 py-3'

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null) // null = sedang memuat

  useEffect(() => {
    let cancelled = false
    Promise.all([getAdminUsers(), getAdminPosts()])
      .then(([users, posts]) => {
        if (!cancelled) setData({ users, posts, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setData({ ...EMPTY_VIEW, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const { users, posts, error } = data ?? EMPTY_VIEW
  const loading = data === null
  const publishedCount = posts.filter((p) => p.is_published).length

  return (
    <main className="w-full space-y-6 px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Pengguna" value={users.length} color="text-slate-900 dark:text-white" />
        <StatCard label="Total Artikel" value={posts.length} color="text-indigo-600" />
        <StatCard label="Artikel Terbit" value={publishedCount} color="text-emerald-600" />
      </div>

      {loading && <p className="text-slate-500">Memuat data...</p>}
      {!loading && error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="px-4 pt-4 text-lg font-bold text-slate-900 dark:text-white">Direktori Pengguna</h2>
            {users.length === 0 ? (
              <p className="p-4 text-slate-500">Belum ada pengguna.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                    <tr>
                      <th className={th}>ID</th>
                      <th className={th}>Username</th>
                      <th className={th}>Email</th>
                      <th className={th}>Role</th>
                      <th className={th}>Artikel</th>
                      <th className={th}>Terbit</th>
                      <th className={th}>Bergabung</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                        <td className={th}>{u.id}</td>
                        <td className={`${th} font-medium`}>{u.username}</td>
                        <td className={th}>{u.email}</td>
                        <td className={th}>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className={th}>{u.total_posts}</td>
                        <td className={th}>{u.total_published}</td>
                        <td className={th}>{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="px-4 pt-4 text-lg font-bold text-slate-900 dark:text-white">Semua Artikel</h2>
            {posts.length === 0 ? (
              <p className="p-4 text-slate-500">Belum ada artikel.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                    <tr>
                      <th className={th}>Judul</th>
                      <th className={th}>Penulis</th>
                      <th className={th}>Kategori</th>
                      <th className={th}>Status</th>
                      <th className={th}>Diperbarui</th>
                      <th className={`${th} text-right`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-200">
                    {posts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                        <td className={`${th} font-medium`}>{p.title}</td>
                        <td className={th}>{p.author.username}</td>
                        <td className={th}>{p.category}</td>
                        <td className={th}>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              p.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {p.is_published ? 'Terbit' : 'Draf'}
                          </span>
                        </td>
                        <td className={th}>{formatDate(p.updated_at)}</td>
                        <td className={`${th} text-right`}>
                          {p.is_published && (
                            <button
                              type="button"
                              aria-label={`Lihat ${p.title}`}
                              className="font-medium text-indigo-600 hover:underline"
                              onClick={() => onNavigate(`/posts/${p.slug}`)}
                            >
                              Lihat
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
