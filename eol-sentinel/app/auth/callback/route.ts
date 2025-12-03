import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_EMAIL_DOMAIN = '@trilogy.com'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Validate email domain
    if (data.user?.email && !data.user.email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase())) {
      // Sign out the user if they don't have a trilogy.com email
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`)}`
      )
    }

    // Redirect to dashboard or next URL
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Authentication failed')}`)
}

