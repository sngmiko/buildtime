import { type HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean
}

export function Card({ className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      {...props}
    />
  )
}
