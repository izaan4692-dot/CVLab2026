import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Get user - try to refresh if needed for admin routes
  let {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to signin if not authenticated
  const protectedRoutes = ['/processing', '/questions', '/resume-preview', '/profile', '/payment']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }

  // Admin routes - require authentication and admin role
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  if (isAdminRoute) {
    // First check if user is authenticated
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Check if user has admin role in user metadata
    // The role is stored in user.user_metadata.role (from raw_user_meta_data in Supabase)
    let userRole = user.user_metadata?.role || user.app_metadata?.role
    let isAdmin = userRole && ['admin', 'service_role', 'super_admin'].includes(userRole)

    // If role is not found, try refreshing user data (metadata might not be immediately available)
    if (!userRole) {
      // Refresh user data to get latest metadata
      const { data: { user: refreshedUser } } = await supabase.auth.getUser()
      if (refreshedUser) {
        userRole = refreshedUser.user_metadata?.role || refreshedUser.app_metadata?.role
        isAdmin = userRole && ['admin', 'service_role', 'super_admin'].includes(userRole)
        user = refreshedUser // Update user reference
      }
    }

    // Always log for debugging admin access issues
    console.log('[Middleware] Admin route check:', {
      path: request.nextUrl.pathname,
      userId: user.id,
      email: user.email,
      user_metadata: JSON.stringify(user.user_metadata),
      app_metadata: JSON.stringify(user.app_metadata),
      user_metadata_role: user.user_metadata?.role,
      app_metadata_role: user.app_metadata?.role,
      resolvedRole: userRole,
      isAdmin,
    })

    if (!isAdmin) {
      // User is not an admin - redirect to home page
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Auth pages that should redirect authenticated users
  const authPagesForGuests = ['/signin', '/signup', '/forgot-password']
  const isGuestAuthPage = authPagesForGuests.some(route =>
    request.nextUrl.pathname === route
  )

  if (isGuestAuthPage && user) {
    // Check if user is admin and redirect to admin dashboard
    // Always refresh user data to ensure we have the latest metadata (especially after login)
    let userRole = user.user_metadata?.role || user.app_metadata?.role
    let isAdmin = userRole && ['admin', 'service_role', 'super_admin'].includes(userRole)
    
    // Fallback: Check by email if role metadata is not available (common right after login)
    const adminEmails = ['admin@cvlab.sa']
    if (!isAdmin && user.email && adminEmails.includes(user.email.toLowerCase())) {
      console.log('[Middleware] Admin detected by email fallback:', user.email)
      isAdmin = true
      userRole = 'admin'
    }
    
    // Always try to refresh user data to get the latest metadata
    // This is especially important right after login when metadata might not be immediately available
    const { data: { user: refreshedUser } } = await supabase.auth.getUser()
    if (refreshedUser) {
      const refreshedRole = refreshedUser.user_metadata?.role || refreshedUser.app_metadata?.role
      if (refreshedRole) {
        userRole = refreshedRole
        isAdmin = userRole && ['admin', 'service_role', 'super_admin'].includes(userRole)
      }
      // Also check email in refreshed user
      if (!isAdmin && refreshedUser.email && adminEmails.includes(refreshedUser.email.toLowerCase())) {
        console.log('[Middleware] Admin detected by email fallback (refreshed):', refreshedUser.email)
        isAdmin = true
        userRole = 'admin'
      }
    }
    
    console.log('[Middleware] Auth page redirect check:', {
      path: request.nextUrl.pathname,
      email: user.email,
      initial_user_metadata_role: user.user_metadata?.role,
      initial_app_metadata_role: user.app_metadata?.role,
      refreshed_user_metadata_role: refreshedUser?.user_metadata?.role,
      refreshed_app_metadata_role: refreshedUser?.app_metadata?.role,
      resolvedRole: userRole,
      isAdmin,
    })
    
    const url = request.nextUrl.clone()
    if (isAdmin) {
      url.pathname = '/admin/overview'
      console.log('[Middleware] Redirecting admin user to /admin/overview')
    } else {
      url.pathname = '/'
      console.log('[Middleware] Redirecting non-admin user to /')
    }
    return NextResponse.redirect(url)
  }

  // Verify email page - allow access but redirect if already verified and logged in
  // Users might want to stay on this page to resend email, so we check via the AuthContext instead

  // Reset password page - requires a valid recovery session
  // If user is not logged in (no recovery session), redirect to forgot-password
  if (request.nextUrl.pathname === '/reset-password' && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/forgot-password'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
