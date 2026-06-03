import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const convite = searchParams.get('convite') || searchParams.get('state') || null

  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      const cookieStore = await cookies()
      const convite = cookieStore.get('convite_codigo')?.value

      if (convite) {
        const response = NextResponse.redirect(`${origin}/entrar/${convite}`)
        response.cookies.delete('convite_codigo')
        return response
      }
      return NextResponse.redirect(`${origin}/palpites`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}