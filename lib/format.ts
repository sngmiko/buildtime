// German number and currency formatting utilities

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '–'
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '–'
  return value.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '–'
  return `${value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE')
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('de-DE')
}
