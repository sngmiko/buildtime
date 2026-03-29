'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { generateSokaReport } from '@/actions/soka'

export function SokaExportButton() {
  const [loading, setLoading] = useState(false)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  async function handleExport() {
    setLoading(true)
    try {
      const csv = await generateSokaReport(month, year)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `soka-bau-meldung-${year}-${String(month).padStart(2, '0')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <Button onClick={handleExport} disabled={loading}>
      <Download className="h-4 w-4" />
      {loading ? 'Exportieren...' : 'SOKA-Meldung exportieren (CSV)'}
    </Button>
  )
}
