import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'recovery' | null
  const next = searchParams.get('next') ?? '/onboarding'
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/login?error=verification_failed', origin))
  }

  const supabase = await createClient()

  // Handle token_hash flow (from email template)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (!verifyError) {
      return NextResponse.redirect(new URL('/onboarding?verified=true', origin))
    }

    console.error('Token verify error:', verifyError)
    return NextResponse.redirect(new URL('/login?error=verification_failed', origin))
  }

  // Handle code flow (from OAuth)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      return NextResponse.redirect(new URL(`${next}?verified=true`, origin))
    }

    console.error('Exchange error:', exchangeError)
  }

  return NextResponse.redirect(new URL('/login?error=verification_failed', origin))
}