import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 bg-[#0c0c14]">
      <h1 className="text-6xl font-bold text-[#f59e0b]">404</h1>
      <p className="text-slate-400">Seite nicht gefunden</p>
      <Link
        href="/"
        className="rounded-lg bg-[#f59e0b] px-4 py-2 text-sm font-medium text-black hover:bg-[#fbbf24] transition-colors"
      >
        Zur Startseite
      </Link>
    </div>
  )
}
