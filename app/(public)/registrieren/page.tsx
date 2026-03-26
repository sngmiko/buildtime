import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { RegisterForm } from '@/components/auth/register-form'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Firma registrieren</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Erstellen Sie Ihr BuildTime-Konto
          </p>
        </div>

        <RegisterForm defaultEmail={email} />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Bereits registriert?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            Anmelden
          </Link>
        </p>
      </div>
    </Card>
  )
}
