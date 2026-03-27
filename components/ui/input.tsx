import { type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]/20 disabled:bg-slate-50 disabled:text-slate-500 ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : 'border-slate-200'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
