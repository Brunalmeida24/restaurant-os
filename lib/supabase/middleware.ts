import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const roleRoutes: Record<string, string> = {
  owner: '/dashboard',
  waiter: '/mesas',
  cook: '/kds',
  cashier: '/fechamento',
}

const routePrefixToRole: { prefix: string; role: string }[] = [
  { prefix: '/mesas-config', role: 'owner' },
  { prefix: '/dashboard', role: 'owner' },
  { prefix: '/financeiro', role: 'owner' },
  { prefix: '/cardapio', role: 'owner' },
  { prefix: '/equipe', role: 'owner' },
  { prefix: '/relatorio', role: 'owner' },
  { prefix: '/mesas', role: 'waiter' },
  { prefix: '/kds', role: 'cook' },
  { prefix: '/fechamento', role: 'cashier' },
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Páginas públicas (não exigem login)
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // 1. Não autenticado tentando acessar área protegida → manda pro login
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Autenticado tentando acessar /login → manda pra área dele
  if (user && isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const url = request.nextUrl.clone()
      url.pathname = roleRoutes[profile.role] ?? '/login'
      return NextResponse.redirect(url)
    }
  }

  // 3. Autenticado acessando área restrita de outro role → bloqueia
  if (user && !isPublicRoute) {
    const matchedRoute = routePrefixToRole.find(r => pathname.startsWith(r.prefix))

    if (matchedRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== matchedRoute.role) {
        const url = request.nextUrl.clone()
        url.pathname = profile ? (roleRoutes[profile.role] ?? '/login') : '/login'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}