/**
 * URL utilities for consistent site URL handling across the application.
 * Production configuration for cvlab.sa
 */

// Production URL - used as fallback for all redirects and callbacks
const PRODUCTION_URL = 'https://cvlab.sa';

/**
 * Get the site URL
 * Uses environment variable if set, otherwise falls back to production URL
 * For production deployment, set NEXT_PUBLIC_SITE_URL to your domain
 * 
 * IMPORTANT: On client-side, never use window.location.origin as it might be
 * 0.0.0.0:3000 which is invalid. Always use the environment variable or production URL.
 */
export function getSiteUrl(): string {
  // Always prefer environment variable if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback to production URL (never use window.location.origin)
  return PRODUCTION_URL;
}

/**
 * Get the auth callback URL for Supabase redirects
 * Uses environment variable if set, otherwise production URL
 * IMPORTANT: This URL must match what's configured in Supabase dashboard
 */
export function getAuthCallbackUrl(): string {
  const siteUrl = getSiteUrl();
  return `${siteUrl}/auth/callback`;
}

/**
 * Get the verify email page URL with email parameter
 */
export function getVerifyEmailUrl(email: string): string {
  return `/verify-email?email=${encodeURIComponent(email)}`;
}

/**
 * Get the reset password URL
 */
export function getResetPasswordUrl(): string {
  return `${getSiteUrl()}/reset-password`;
}
