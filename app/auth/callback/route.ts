import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { errorMessage } from '@/lib/log-redact'

async function resolvePostAuthPath(
  supabase: ReturnType<typeof createServerClient>
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return '/login?error=verification_failed'
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_completed) {
    return '/dashboard'
  }

  return '/onboarding?verified=true'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'recovery' | null
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', origin)
    )
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // Email verification (token_hash from email link)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (!verifyError) {
      const path = await resolvePostAuthPath(supabase)
      return NextResponse.redirect(new URL(path, origin))
    }

    console.error('[auth/callback] token verify failed:', errorMessage(verifyError))
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', origin)
    )
  }

  // OAuth / magic link (code exchange)
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const path = await resolvePostAuthPath(supabase)
      return NextResponse.redirect(new URL(path, origin))
    }

    console.error('[auth/callback] code exchange failed:', errorMessage(exchangeError))
  }

  return NextResponse.redirect(
    new URL('/login?error=verification_failed', origin)
  )
}
