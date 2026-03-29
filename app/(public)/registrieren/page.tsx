import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Firma registrieren</h2>
        <p className="mt-1 text-sm text-slate-500">
          Erstellen Sie in 3 Schritten Ihr NomadWorks-Konto — kostenlos für 7 Tage.
        </p>
      </div>

      <RegisterForm defaultEmail={email} />

      <p className="text-center text-sm text-slate-500">
        Bereits registriert?{' '}
        <Link href="/login" className="font-medium text-[#1e3a5f] hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  )
}
