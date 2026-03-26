import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ fn?: string; ln?: string }>
}) {
  const { token } = await params
  const { fn, ln } = await searchParams

  const admin = createAdminClient()
  const { data: invitation } = await admin
    .from('invitations')
    .select('*, companies(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) {
    notFound()
  }

  const companyName = (invitation.companies as { name: string })?.name || 'Unbekannte Firma'

  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Einladung annehmen</h1>
        </div>

        <AcceptInviteForm
          token={token}
          defaultEmail={invitation.email || undefined}
          firstName={fn}
          lastName={ln}
          companyName={companyName}
        />
      </div>
    </Card>
  )
}
