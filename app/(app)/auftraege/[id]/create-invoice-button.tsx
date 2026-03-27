'use client'

import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { createInvoiceFromOrder } from '@/actions/invoices'
import { useState } from 'react'

export function CreateInvoiceButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    await createInvoiceFromOrder(orderId)
    setLoading(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <FileText className="h-4 w-4" />
      {loading ? 'Erstelle...' : 'Rechnung erstellen'}
    </Button>
  )
}
