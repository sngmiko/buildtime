import { type ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-[--color-primary] text-white hover:bg-[--color-primary-light] shadow-sm',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  accent:
    'bg-[--color-accent] text-white hover:bg-[--color-accent-dark] shadow-sm',
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--color-primary] disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  )
}
