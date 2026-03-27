import { type HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean
  gradient?: boolean
}

export function Card({ className = '', hover = false, gradient = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm ${hover ? 'card-hover cursor-pointer' : ''} ${gradient ? 'bg-gradient-primary text-white border-transparent' : ''} ${className}`}
      {...props}
    />
  )
}
