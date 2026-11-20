// Tiga kartu ringkasan: Total Artikel, Terbit, Draf.
function Card({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function PostStats({ total, published, draft }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card label="Total Artikel" value={total} color="text-slate-900 dark:text-white" />
      <Card label="Terbit" value={published} color="text-emerald-600" />
      <Card label="Draf" value={draft} color="text-amber-600" />
    </div>
  )
}
