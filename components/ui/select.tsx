import { type SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, id, options, className = '', ...props }: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-400">
        {label}
      </label>
      <select
        id={selectId}
        className={`h-11 rounded-xl border bg-white/5 px-3 text-sm text-slate-100 transition-colors focus:border-[#f59e0b] focus:outline-none focus:ring-1 focus:ring-[#f59e0b]/30 ${error ? 'border-red-500/50' : 'border-white/10'} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
