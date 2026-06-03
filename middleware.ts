import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/entrar') ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
  return NextResponse.redirect(new URL('/login', request.url))
  }

  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
  const isEntrar = request.nextUrl.pathname.startsWith('/entrar')

  if (!isOnboarding && !isEntrar) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completo')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_completo) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
}

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
