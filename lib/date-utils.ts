export function getDateRange(period: string, offset: number): { start: Date; end: Date } {
  const now = new Date()
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59)
    return { start, end }
  }
  // week
  const start = new Date(now)
  start.setDate(start.getDate() - start.getDay() + 1 + offset * 7)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}
