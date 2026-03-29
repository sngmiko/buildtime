'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from './button'

export function WhatsAppReminder({
  phone,
  name,
  siteName,
  siteAddress,
  appUrl,
}: {
  phone: string
  name: string
  siteName: string
  siteAddress?: string
  appUrl?: string
}) {
  const cleanPhone = phone.replace(/[^0-9+]/g, '').replace(/^0/, '49').replace(/^\+/, '')
  const message = `Hallo ${name}, vergiss nicht dich einzustempeln! 🏗️\n\nDeine Baustelle heute: ${siteName}${siteAddress ? `\n📍 ${siteAddress}` : ''}\n\n${appUrl ? `Hier einstempeln: ${appUrl}/stempeln` : ''}`
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </Button>
    </a>
  )
}
