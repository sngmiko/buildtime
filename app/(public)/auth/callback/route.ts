import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Check if user has a profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // SSO user without profile — redirect to registration with prefilled email
    const email = encodeURIComponent(user.email || '')
    return NextResponse.redirect(new URL(`/registrieren?email=${email}`, origin))
  }

  // Redirect based on role
  const destination = profile.role === 'worker' ? '/stempeln' : '/dashboard'
  return NextResponse.redirect(new URL(destination, origin))
}
