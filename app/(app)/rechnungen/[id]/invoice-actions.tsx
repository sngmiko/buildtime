'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceStatus, createPaymentReminder } from '@/actions/invoices'
import { Button } from '@/components/ui/button'
import { Send, CheckCircle, AlertTriangle } from 'lucide-react'

type Props = {
  invoiceId: string
  status: string
}

export function InvoiceActions({ invoiceId, status }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleStatus(newStatus: string) {
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, newStatus)
      router.refresh()
    })
  }

  function handleReminder() {
    startTransition(async () => {
      await createPaymentReminder(invoiceId)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' && (
        <Button onClick={() => handleStatus('sent')} disabled={pending} size="sm">
          <Send className="h-4 w-4" />
          Als gesendet markieren
        </Button>
      )}
      {status === 'sent' && (
        <Button onClick={() => handleStatus('paid')} disabled={pending} size="sm" variant="secondary">
          <CheckCircle className="h-4 w-4" />
          Als bezahlt markieren
        </Button>
      )}
      {status === 'overdue' && (
        <>
          <Button onClick={() => handleStatus('paid')} disabled={pending} size="sm" variant="secondary">
            <CheckCircle className="h-4 w-4" />
            Als bezahlt markieren
          </Button>
          <Button onClick={handleReminder} disabled={pending} size="sm" variant="outline">
            <AlertTriangle className="h-4 w-4" />
            Mahnung erstellen
          </Button>
        </>
      )}
      {status === 'sent' && (
        <Button onClick={handleReminder} disabled={pending} size="sm" variant="outline">
          <AlertTriangle className="h-4 w-4" />
          Mahnung erstellen
        </Button>
      )}
    </div>
  )
}
