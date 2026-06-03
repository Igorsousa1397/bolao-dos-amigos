import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      const convite = request.headers.get('cookie')
        ?.split(';')
        .find(c => c.trim().startsWith('convite_codigo='))
        ?.split('=')[1]
        ?.trim()

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