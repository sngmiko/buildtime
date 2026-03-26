import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Willkommen zurück</h2>
        <p className="mt-1 text-sm text-slate-500">
          Melden Sie sich bei Ihrem Konto an
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-slate-500">
        Noch kein Konto?{' '}
        <Link href="/registrieren" className="font-medium text-[--color-primary] hover:underline">
          Firma registrieren
        </Link>
      </p>
    </div>
  )
}
