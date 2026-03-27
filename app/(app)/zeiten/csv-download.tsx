'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportCSV } from '@/actions/export'

export function CSVDownload({ userId, startDate, endDate }: { userId: string; startDate: string; endDate: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const csv = await exportCSV(userId, startDate, endDate)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stundenzettel-${startDate}-${endDate}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">{loading ? 'Export...' : 'CSV'}</span>
    </Button>
  )
}
