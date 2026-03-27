export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
      <div className="skeleton h-4 w-1/3 mb-4" />
      <div className="skeleton h-8 w-1/2 mb-2" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      <div className="skeleton h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-slate-100">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-4 w-1/6" />
          <div className="skeleton h-4 w-1/6" />
        </div>
      ))}
    </div>
  )
}
