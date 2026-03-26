import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card>
        <p className="text-zinc-600 dark:text-zinc-400">
          Willkommen bei BuildTime. Das Dashboard wird in Phase 2 mit Zeiterfassungsdaten befüllt.
        </p>
      </Card>
    </div>
  )
}
