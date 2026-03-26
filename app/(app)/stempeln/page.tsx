import { Card } from '@/components/ui/card'

export default function StempelnPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold">Stempeluhr</h1>
      <Card className="w-full max-w-sm text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Die Stempeluhr wird in Phase 2 implementiert.
        </p>
      </Card>
    </div>
  )
}
