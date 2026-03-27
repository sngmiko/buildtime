import { type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-400">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-11 rounded-xl border bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-[#f59e0b] focus:outline-none focus:ring-1 focus:ring-[#f59e0b]/30 disabled:bg-white/[0.02] disabled:text-slate-500 ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : 'border-white/10'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
