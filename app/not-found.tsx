import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-6xl font-bold text-[#1e3a5f]">404</h1>
      <p className="text-slate-600">Seite nicht gefunden</p>
      <Link
        href="/"
        className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4f7f] transition-colors"
      >
        Zur Startseite
      </Link>
    </div>
  )
}
