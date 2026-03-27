import { type HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean
  gradient?: boolean
  dark?: boolean
}

export function Card({ className = '', hover = false, gradient = false, dark = false, ...props }: CardProps) {
  const base = dark
    ? 'rounded-2xl border border-slate-700/50 bg-slate-800 p-6 text-white'
    : 'rounded-2xl border border-slate-200/80 bg-white p-6'
  const hoverCls = hover ? 'card-hover cursor-pointer' : ''
  const gradientCls = gradient ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700/50' : ''

  return (
    <div
      className={`${base} ${hoverCls} ${gradientCls} ${className}`}
      {...props}
    />
  )
}
