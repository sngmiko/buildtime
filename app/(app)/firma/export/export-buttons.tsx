'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Download } from 'lucide-react'
import { generateMonthlyExport } from '@/actions/soka'

export function ExportButtons() {
  const [loading, setLoading] = useState(false)
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  async function handleExport() {
    setLoading(true)
    try {
      const csv = await generateMonthlyExport(parseInt(month), parseInt(year))
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stundennachweise-${year}-${month.padStart(2, '0')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const months = [
    { value: '1', label: 'Januar' }, { value: '2', label: 'Februar' }, { value: '3', label: 'März' },
    { value: '4', label: 'April' }, { value: '5', label: 'Mai' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Dezember' },
  ]

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Select label="Monat" name="month" defaultValue={month} options={months}
          onChange={(e) => setMonth((e.target as HTMLSelectElement).value)} />
      </div>
      <div>
        <Select label="Jahr" name="year" defaultValue={year}
          options={[{ value: '2025', label: '2025' }, { value: '2026', label: '2026' }, { value: '2027', label: '2027' }]}
          onChange={(e) => setYear((e.target as HTMLSelectElement).value)} />
      </div>
      <Button onClick={handleExport} disabled={loading}>
        <Download className="h-4 w-4" />
        {loading ? 'Exportieren...' : 'CSV herunterladen'}
      </Button>
    </div>
  )
}
