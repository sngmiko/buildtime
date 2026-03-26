import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">BuildTime</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Melden Sie sich an
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Noch kein Konto?{' '}
          <Link href="/registrieren" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            Firma registrieren
          </Link>
        </p>
      </div>
    </Card>
  )
}
