'use client'

import { useActionState } from 'react'
import { login, type AuthState } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, null)

  function handleMicrosoftLogin() {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <Input
          label="E-Mail"
          name="email"
          type="email"
          placeholder="max@firma.de"
          required
          error={state?.errors?.email?.[0]}
        />
        <Input
          label="Passwort"
          name="password"
          type="password"
          required
          error={state?.errors?.password?.[0]}
        />
        {state?.message && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        )}
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? 'Anmelden...' : 'Anmelden'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-300 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            oder
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleMicrosoftLogin}
      >
        Mit Microsoft anmelden
      </Button>
    </div>
  )
}
