import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Production URL for redirects - fallback if request origin is invalid
const PRODUCTION_URL = 'https://cvlab.sa';

/**
 * Get the site URL from the request, with fallbacks
 * Handles cases where request might come from 0.0.0.0 or invalid origins
 */
function getSiteUrl(request: NextRequest): string {
  // Try to get from environment variable first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Get origin from request
  const origin = request.headers.get('origin') || request.headers.get('host');
  
  if (origin) {
    // Check if origin is a valid URL or just a host
    try {
      // If it's already a full URL, use it
      if (origin.startsWith('http://') || origin.startsWith('https://')) {
        const url = new URL(origin);
        // Don't use 0.0.0.0 as it's invalid for browsers
        if (url.hostname !== '0.0.0.0' && url.hostname !== '127.0.0.1') {
          return origin;
        }
      } else {
        // It's just a hostname, construct URL
        const hostname = origin.split(':')[0]; // Remove port if present
        // Don't use 0.0.0.0 as it's invalid for browsers
        if (hostname !== '0.0.0.0' && hostname !== '127.0.0.1') {
          // Use https for production, http for localhost
          const protocol = hostname === 'localhost' ? 'http' : 'https';
          const port = origin.includes(':') ? origin.split(':')[1] : '';
          return port ? `${protocol}://${hostname}:${port}` : `${protocol}://${hostname}`;
        }
      }
    } catch (e) {
      // Invalid URL, fall through to production URL
    }
  }

  // Fallback to production URL
  return PRODUCTION_URL;
}

/**
 * Fix redirect URL by replacing invalid hostnames (0.0.0.0, 127.0.0.1) with correct site URL
 */
function fixRedirectUrl(url: URL, correctSiteUrl: string): URL {
  const urlObj = new URL(url.toString());
  const correctUrl = new URL(correctSiteUrl);
  
  // If hostname is invalid, replace it with correct one
  if (urlObj.hostname === '0.0.0.0' || urlObj.hostname === '127.0.0.1') {
    urlObj.protocol = correctUrl.protocol;
    urlObj.hostname = correctUrl.hostname;
    // Only replace port if it's not the standard port for the protocol
    if (correctUrl.port && correctUrl.port !== (correctUrl.protocol === 'https:' ? '443' : '80')) {
      urlObj.port = correctUrl.port;
    } else if (!correctUrl.port || correctUrl.port === (correctUrl.protocol === 'https:' ? '443' : '80')) {
      urlObj.port = '';
    }
  }
  
  return urlObj;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()
  
  // Check for banned user error from Supabase redirect
  const error = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  
  if (error === 'access_denied' && errorCode === 'user_banned') {
    const siteUrl = getSiteUrl(request);
    const redirectUrl = fixRedirectUrl(new URL('/signin', requestUrl.origin), siteUrl);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_code', 'user_banned');
    redirectUrl.searchParams.set('error_description', 'User is banned');
    return NextResponse.redirect(redirectUrl);
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
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Get site URL from request with proper fallbacks
  const siteUrl = getSiteUrl(request);

  // Handle email verification (signup confirmation, password recovery, etc.)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'email',
      token_hash,
    })

    if (error) {
      console.error('Email verification error:', error)
      // Fix redirect URL to use correct hostname
      const redirectUrl = fixRedirectUrl(new URL('/signin', requestUrl.origin), siteUrl);
      redirectUrl.searchParams.set('error', 'verification_failed');
      redirectUrl.searchParams.set('message', error.message);
      return NextResponse.redirect(redirectUrl)
    }

    // Email verified successfully - user is now logged in
    if (type === 'signup') {
      // Signup verification - redirect to home with success message
      const redirectUrl = fixRedirectUrl(new URL('/', requestUrl.origin), siteUrl);
      redirectUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectUrl)
    }
    if (type === 'recovery') {
      // Password recovery - redirect to reset password page
      const redirectUrl = fixRedirectUrl(new URL('/reset-password', requestUrl.origin), siteUrl);
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl)
    }

    // Other verification types - redirect to home
    const redirectUrl = fixRedirectUrl(new URL('/', requestUrl.origin), siteUrl);
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl)
  }

  // Handle OAuth callback (Google sign in, etc.)
  if (code) {
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      // Fix redirect URL to use correct hostname
      const redirectUrl = fixRedirectUrl(new URL('/signin', requestUrl.origin), siteUrl);
      
      // Check if user is banned
      if (error.message?.toLowerCase().includes('banned') || 
          error.message?.toLowerCase().includes('access denied') ||
          requestUrl.searchParams.get('error_code') === 'user_banned') {
        redirectUrl.searchParams.set('error', 'access_denied');
        redirectUrl.searchParams.set('error_code', 'user_banned');
        redirectUrl.searchParams.set('error_description', 'User is banned');
      } else {
        redirectUrl.searchParams.set('error', 'auth_failed');
      }
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin and redirect to admin/overview
    if (data?.user) {
      const userRole = data.user.user_metadata?.role || data.user.app_metadata?.role;
      const adminRoles = ['admin', 'service_role', 'super_admin'];
      const isAdmin = userRole && adminRoles.includes(userRole);
      
      if (isAdmin) {
        const redirectUrl = fixRedirectUrl(new URL('/admin/dashboard', requestUrl.origin), siteUrl);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // URL to redirect to after sign in process completes
  if (redirectTo) {
    try {
      // Try to parse redirectTo as absolute URL first
      const redirectUrl = new URL(redirectTo);
      // Fix the redirect URL if it has invalid hostname
      return NextResponse.redirect(fixRedirectUrl(redirectUrl, siteUrl));
    } catch {
      // If it's a relative path, construct from correct site URL
      const redirectUrl = new URL(redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`, siteUrl);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Default redirect to home - use correct site URL
  const redirectUrl = new URL('/', siteUrl);
  return NextResponse.redirect(redirectUrl)
}
