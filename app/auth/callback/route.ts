import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Supabase redirect URL configuration:
// Go to Supabase Dashboard → Authentication → URL Configuration
// Set "Redirect URLs" to: https://getpaidly.co/auth/callback
// (For local development: http://localhost:3000/auth/callback)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Email verified successfully — go to onboarding
      const response = NextResponse.redirect(
        new URL('/onboarding?verified=true', request.url)
      )
      return response
    }
  }

  // Verification failed
  return NextResponse.redirect(
    new URL('/login?error=verification_failed', request.url)
  )
}
