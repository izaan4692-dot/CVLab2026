'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

function SignInErrorHandler({ setError, setSuccessMessage }: { setError: (error: string | null) => void; setSuccessMessage: (message: string | null) => void }) {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    const urlError = searchParams.get('error');
    const urlErrorCode = searchParams.get('error_code');
    const urlErrorDescription = searchParams.get('error_description');
    const urlMessage = searchParams.get('message');

    if (urlMessage === 'check_email') {
      setSuccessMessage(t('checkEmailMessage') || 'Account created! Please check your email and click the confirmation link, then sign in.');
      window.history.replaceState({}, '', '/signin');
      return;
    }

    if (urlError) {
      // Handle banned user error
      if (urlError === 'access_denied' && urlErrorCode === 'user_banned') {
        const errorMsg = t('accountDeactivated') || 'Your account has been deactivated. Please contact support if you believe this is an error.';
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 6000,
        });
        window.history.replaceState({}, '', '/signin');
        return;
      }
      
      if (urlError === 'verification_failed') {
        setError(urlMessage || t('verificationFailed') || 'Email verification failed. Please try again.');
        toast.error(t('verificationFailed') || 'Email verification failed.');
      } else if (urlError === 'auth_failed') {
        setError(t('authFailed') || 'Authentication failed. Please try again.');
      }
      window.history.replaceState({}, '', '/signin');
    }
  }, [searchParams, t, setError, setSuccessMessage]);

  return null;
}

function SignInContent() {
  const { language, setLanguage, t } = useLanguage();
  const isRTL = language === 'ar';
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isHandlingLogin, setIsHandlingLogin] = useState(false);
  const loginInProgressRef = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Redirect if already logged in - check admin status first
  // But don't redirect if we're in the middle of handling a login
  useEffect(() => {
    // Only redirect if we're NOT handling a login (to prevent race conditions)
    // The handleSubmit function will handle redirects after login
    if (!authLoading && user && !isHandlingLogin && !loginInProgressRef.current) {
      console.log('[SignIn] useEffect triggered - user is logged in, checking admin status');
      const checkAdminAndRedirect = async () => {
        try {
          // Get fresh user data to check admin role
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser) {
            const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
            const adminRoles = ['admin', 'service_role', 'super_admin'];
            let isAdmin = userRole && adminRoles.includes(userRole);
            
            // Fallback: Check by email if role metadata is not available
            const adminEmails = ['admin@cvlab.sa'];
            if (!isAdmin && currentUser.email && adminEmails.includes(currentUser.email.toLowerCase())) {
              console.log('[SignIn] useEffect: Admin detected by email fallback:', currentUser.email);
              isAdmin = true;
            }
            
            console.log('[SignIn] useEffect admin check:', { userRole, email: currentUser.email, isAdmin, isHandlingLogin, loginInProgress: loginInProgressRef.current });
            
            if (isAdmin) {
              console.log('[SignIn] useEffect redirecting admin to /admin/dashboard');
              window.location.href = '/admin/dashboard';
            } else {
              console.log('[SignIn] useEffect redirecting non-admin to /');
              window.location.href = '/';
            }
          } else {
            console.log('[SignIn] useEffect no user found, redirecting to /');
            window.location.href = '/';
          }
        } catch (err) {
          console.error('[SignIn] useEffect error checking admin status:', err);
          window.location.href = '/';
        }
      };
      
      checkAdminAndRedirect();
    } else if (user && (isHandlingLogin || loginInProgressRef.current)) {
      console.log('[SignIn] useEffect skipped - login in progress', { isHandlingLogin, loginInProgress: loginInProgressRef.current });
    }
  }, [user, authLoading, router, supabase]);

  // Clear password on error for security
  const clearPassword = () => {
    setFormData(prev => ({ ...prev, password: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    // Set these flags BEFORE calling signIn to prevent useEffect from running
    setIsSubmitting(true);
    setIsHandlingLogin(true);
    loginInProgressRef.current = true;

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        setIsHandlingLogin(false);
        loginInProgressRef.current = false;
        const errorMessage = error.message.toLowerCase();

        // Handle specific error cases with friendly toasts
        if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
          // Show friendly toast for wrong password
          toast.error(t('wrongPassword') || "That password doesn't look right. Give it another try!", {
            duration: 4000,
          });
          setError(t('invalidCredentials') || 'Incorrect email or password.');
        } else if (errorMessage.includes('email not confirmed')) {
          toast.error(t('pleaseVerifyFirst') || 'Please verify your email first. Check your inbox!', {
            duration: 4000,
          });
          setError(t('emailNotConfirmed') || 'Please confirm your email before signing in.');
        } else if (errorMessage.includes('user not found') || errorMessage.includes('no user found')) {
          // User doesn't exist - show toast and redirect to signup
          toast.error(t('noAccountFound') || "We couldn't find an account with that email. Let's create one!", {
            duration: 3000,
          });
          clearPassword();
          setIsSubmitting(false);
          // Redirect to signup after 3 seconds
          setTimeout(() => {
            router.push(`/signup?email=${encodeURIComponent(formData.email)}`);
          }, 3000);
          return;
        } else if (errorMessage.includes('user banned') || errorMessage.includes('banned') || errorMessage.includes('access denied')) {
          // User account is banned/deactivated
          const errorMsg = t('accountDeactivated') || 'Your account has been deactivated. Please contact support if you believe this is an error.';
          toast.error(errorMsg, {
            duration: 6000,
          });
          setError(errorMsg);
          clearPassword();
          return;
        } else if (errorMessage.includes('too many requests')) {
          toast.error(t('tooManyTries') || 'Too many attempts. Take a breather and try again in a bit.', {
            duration: 4000,
          });
          setError(t('tooManyAttempts') || 'Too many login attempts. Please wait a moment.');
        } else {
          toast.error(t('somethingWentWrong') || 'Something went wrong. Please try again.', {
            duration: 4000,
          });
          setError(error.message || t('failedToSignIn') || 'Failed to sign in.');
        }
        clearPassword();
      } else {
        toast.success(t('welcomeBack') || 'Welcome back!', {
          duration: 3000,
        });
        
        // Immediately check if user is admin and redirect accordingly
        // Do this synchronously to prevent useEffect from redirecting first
        try {
          // Get fresh user data to check admin role immediately
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          console.log('[SignIn] Checking admin status after login:', {
            userId: currentUser?.id,
            email: currentUser?.email,
            user_metadata_role: currentUser?.user_metadata?.role,
            app_metadata_role: currentUser?.app_metadata?.role,
          });
          
          if (currentUser) {
            const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
            const adminRoles = ['admin', 'service_role', 'super_admin'];
            let isAdmin = userRole && adminRoles.includes(userRole);
            
            // Fallback: Check by email if role metadata is not available (common right after login)
            const adminEmails = ['admin@cvlab.sa'];
            if (!isAdmin && currentUser.email && adminEmails.includes(currentUser.email.toLowerCase())) {
              console.log('[SignIn] Admin detected by email fallback:', currentUser.email);
              isAdmin = true;
            }
            
            console.log('[SignIn] Admin check result:', { userRole, email: currentUser.email, isAdmin });
            
            if (isAdmin) {
              console.log('[SignIn] Redirecting admin to /admin/dashboard');
              setIsHandlingLogin(false);
              loginInProgressRef.current = false;
              // Use window.location for immediate redirect to bypass any routing issues
              window.location.href = '/admin/dashboard';
              return;
            }
          }
        } catch (err) {
          console.error('[SignIn] Error checking admin status:', err);
        }
        
        // Default redirect for non-admin users
        console.log('[SignIn] Redirecting non-admin user to /');
        setIsHandlingLogin(false);
        loginInProgressRef.current = false;
        window.location.href = '/';
      }
    } catch (err) {
      setIsHandlingLogin(false);
      loginInProgressRef.current = false;
      toast.error(t('oopsSomethingWrong') || 'Oops! Something went wrong. Please try again.', {
        duration: 4000,
      });
      setError(t('unexpectedError') || 'An unexpected error occurred.');
      clearPassword();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message || 'Failed to sign in with Google.');
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <Suspense fallback={null}>
        <SignInErrorHandler setError={setError} setSuccessMessage={setSuccessMessage} />
      </Suspense>
      {/* Left visual panel */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/background-image.png')",
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '110%',
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 flex h-full flex-col justify-center px-14 text-white space-y-4">
          <h1 className="text-5xl font-normal leading-tight max-w-xl">
            {t('optimizeCV')}
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed max-w-xl">
            {t('transformResume')}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-[#f7f9fb] px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
          <div className="flex items-center justify-center">
            <Image
              src="/assets/Main_logo.svg"
              alt="CVLab Logo"
              width={200}
              height={200}
              className="h-20 w-auto"
            />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-4xl font-normal text-gray-900">
              {t('welcomeBack')}
            </h2>
            <p className="text-base text-gray-600">
              {t('loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-[#f7f9fb] rounded-2xl p-6 shadow-sm">
            {successMessage && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>
                {t('emailAddress')}
              </label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type="email"
                  placeholder={t('enterEmail')}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 text-right' : 'pl-11'}`}
                  autoComplete="email"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>
                {t('password')}
              </label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 pl-12 text-right' : 'pl-11 pr-12'}`}
                  autoComplete="current-password"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                  className="border-gray-300"
                />
                <label
                  htmlFor="remember"
                  className="text-gray-600 cursor-pointer"
                >
                  {t('rememberMe')}
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('signingIn') || 'Signing in...'}
                </>
              ) : (
                <>
                  {isRTL ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  {t('login')}
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-800 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('continueWithGoogle')}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700">
                {t('noAccount')}
              </p>
              <div>
                <Link
                  href="/signup"
                  className="text-sm font-bold text-gray-900 hover:underline"
                >
                  {t('signUp')}
                </Link>
              </div>
            </div>
          </form>

          <div className="flex justify-center">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {language === 'en' ? 'English' : 'العربية'}
              <span className="text-gray-400">▾</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return <SignInContent />;
}
