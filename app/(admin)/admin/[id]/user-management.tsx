'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  adminResetPassword,
  adminUpdateUser,
  adminDeleteUser,
  adminGenerateInviteLink,
  type AdminState,
} from '@/actions/admin'
import { Mail, Key, Pencil, Trash2, Link2, ChevronDown, ChevronUp, User } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  foreman: 'Bauleiter',
  worker: 'Arbeiter',
  super_admin: 'Super-Admin',
}

type AuthInfo = { email: string; last_sign_in_at: string | null; created_at: string }

export function UserManagement({
  profiles,
  authMap,
}: {
  profiles: Profile[]
  authMap: Record<string, AuthInfo>
}) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const router = useRouter()

  async function handleDelete() {
    if (!deleteTarget) return
    await adminDeleteUser(deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      <div className="divide-y divide-slate-100">
        {profiles.map((p) => {
          const auth = authMap[p.id]
          const expanded = expandedUser === p.id
          return (
            <div key={p.id}>
              {/* User row */}
              <div
                className="flex cursor-pointer items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                onClick={() => setExpandedUser(expanded ? null : p.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-medium text-white">
                    {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.first_name} {p.last_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail className="h-3 w-3" />
                      {auth?.email || '–'}
                      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {ROLE_LABELS[p.role] || p.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {auth?.last_sign_in_at && (
                    <span className="hidden text-xs text-slate-400 sm:inline">
                      Letzter Login: {new Date(auth.last_sign_in_at).toLocaleDateString('de-DE')}
                    </span>
                  )}
                  {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="mb-4 ml-12 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
                  {/* User details */}
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-slate-700">Details</h4>
                    <dl className="space-y-1.5">
                      <div className="flex justify-between"><dt className="text-slate-500">User-ID</dt><dd className="font-mono text-[10px] text-slate-600">{p.id.slice(0, 8)}...</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">E-Mail</dt><dd className="text-slate-900">{auth?.email || '–'}</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Telefon</dt><dd className="text-slate-900">{p.phone || '–'}</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Erstellt</dt><dd className="text-slate-900">{new Date(p.created_at).toLocaleDateString('de-DE')}</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Letzter Login</dt><dd className="text-slate-900">{auth?.last_sign_in_at ? formatDateTime(auth.last_sign_in_at) : 'Noch nie'}</dd></div>
                    </dl>
                  </div>

                  {/* Edit user */}
                  <EditUserForm userId={p.id} profile={p} email={auth?.email || ''} />

                  {/* Password + Actions */}
                  <div className="space-y-4">
                    <PasswordResetForm userId={p.id} />
                    <div className="border-t border-slate-200 pt-4">
                      <InviteLinkButton email={auth?.email || ''} />
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setDeleteTarget({ id: p.id, name: `${p.first_name} ${p.last_name}` })}
                      >
                        <Trash2 className="h-4 w-4" /> Benutzer löschen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Benutzer löschen?"
        message={`Möchten Sie "${deleteTarget?.name}" wirklich unwiderruflich löschen? Alle zugehörigen Daten werden entfernt.`}
        confirmLabel="Endgültig löschen"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

function EditUserForm({ userId, profile, email }: { userId: string; profile: Profile; email: string }) {
  const boundUpdate = adminUpdateUser.bind(null, userId)
  const [state, action, pending] = useActionState<AdminState, FormData>(boundUpdate, null)

  return (
    <div>
      <h4 className="mb-2 font-semibold text-slate-700">Bearbeiten</h4>
      <form action={action} className="flex flex-col gap-2">
        <Input label="Vorname" name="first_name" defaultValue={profile.first_name} />
        <Input label="Nachname" name="last_name" defaultValue={profile.last_name} />
        <Input label="E-Mail" name="email" type="email" defaultValue={email} />
        <Select label="Rolle" name="role" defaultValue={profile.role} options={[
          { value: 'owner', label: 'Inhaber' },
          { value: 'foreman', label: 'Bauleiter' },
          { value: 'worker', label: 'Arbeiter' },
          { value: 'super_admin', label: 'Super-Admin' },
        ]} />
        {state?.message && (
          <p className={`text-xs ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          <Pencil className="h-3 w-3" /> {pending ? 'Speichern...' : 'Speichern'}
        </Button>
      </form>
    </div>
  )
}

function PasswordResetForm({ userId }: { userId: string }) {
  const boundReset = adminResetPassword.bind(null, userId)
  const [state, action, pending] = useActionState<AdminState, FormData>(boundReset, null)

  return (
    <div>
      <h4 className="mb-2 font-semibold text-slate-700">Passwort ändern</h4>
      <form action={action} className="flex flex-col gap-2">
        <Input label="Neues Passwort" name="new_password" type="text" placeholder="Mindestens 6 Zeichen" />
        {state?.message && (
          <p className={`text-xs ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>
        )}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          <Key className="h-3 w-3" /> {pending ? 'Ändern...' : 'Passwort setzen'}
        </Button>
      </form>
    </div>
  )
}

function InviteLinkButton({ email }: { email: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!email) return
    setLoading(true)
    const result = await adminGenerateInviteLink(email)
    setLink(result?.inviteLink || null)
    setLoading(false)
  }

  async function copy() {
    if (link) {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (link) {
    return (
      <div className="flex flex-col gap-2">
        <h4 className="font-semibold text-slate-700">Einladungslink</h4>
        <input readOnly value={link} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs" />
        <Button size="sm" variant="outline" onClick={copy}>
          <Link2 className="h-3 w-3" /> {copied ? 'Kopiert!' : 'Kopieren'}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h4 className="mb-2 font-semibold text-slate-700">Einladungslink</h4>
      <Button size="sm" variant="outline" onClick={generate} disabled={loading || !email}>
        <Link2 className="h-3 w-3" /> {loading ? 'Generieren...' : 'Link generieren'}
      </Button>
    </div>
  )
}
