import { type HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean
}

export function Card({ className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-[#12121e] p-6 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      {...props}
    />
  )
}
