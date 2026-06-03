import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const convite = searchParams.get('convite')

  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      if (convite) {
        return NextResponse.redirect(`${origin}/entrar/${convite}`)
      }
      return NextResponse.redirect(`${origin}/palpites`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}