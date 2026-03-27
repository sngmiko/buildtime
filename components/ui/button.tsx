import { type ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-[#f59e0b] text-black hover:bg-[#fbbf24] shadow-sm hover:shadow-md',
  secondary:
    'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 shadow-sm',
  destructive:
    'bg-red-500/90 text-white hover:bg-red-500 shadow-sm',
  outline:
    'border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white',
  ghost:
    'text-slate-400 hover:bg-white/5 hover:text-slate-200',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f59e0b] disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  )
}
