'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getAuthCallbackUrl } from '@/lib/utils/url';

// Email verification modal component
function EmailVerificationModal({
  isOpen,
  email,
  onClose,
  onResend,
  isResending,
  t
}: {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onResend: () => void;
  isResending: boolean;
  t: (key: string) => string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">
            You're almost there!
          </h3>

          <p className="text-gray-600">
            We've sent a verification link to:
          </p>

          <p className="font-semibold text-gray-900 break-all">
            {email}
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mt-6">
            <p className="font-medium text-blue-900 mb-2">
              Just one more step:
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open your email</li>
              <li>Click the verification link</li>
              <li>You're all set!</li>
            </ol>
          </div>

          {/* Resend button */}
          <div className="pt-4 space-y-3">
            <p className="text-sm text-gray-500">
              Didn't get the email?
            </p>
            <Button
              onClick={onResend}
              disabled={isResending}
              variant="outline"
              className="w-full h-11 border-gray-200 hover:bg-gray-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Email'
              )}
            </Button>
          </div>

          {/* Back to signin */}
          <div className="pt-2">
            <Link
              href="/signin"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignUpContent() {
  const { language, setLanguage, t } = useLanguage();
  const { signInWithGoogle, user, loading: authLoading, supabase } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  // Pre-fill email from URL query parameter (when redirected from signin)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
      // Show a friendly message
      toast.info(t('letsGetYouStarted') || "Let's get you started! Just fill in the details below.", {
        duration: 4000,
      });
    }
  }, [searchParams, t]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (password.length === 0) return { level: 0, label: '' };
    if (password.length < 6) return { level: 1, label: t('weak') };
    if (password.length < 10) return { level: 2, label: t('good') };
    return { level: 3, label: t('strong') };
  }, [formData.password, t]);

  const clearSensitiveFields = () => {
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) {
        toast.error(error.message || t('failedToResend') || 'Failed to resend email.');
      } else {
        toast.success(t('verificationResent') || 'Verification email sent! Check your inbox.');
      }
    } catch {
      toast.error(t('unexpectedError') || 'Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError(t('passwordTooShort') || 'Password must be at least 6 characters long.');
      return;
    }

    if (!formData.agreeToTerms) {
      setError(t('mustAgreeToTerms') || 'You must agree to the terms and conditions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (signUpError) {
        const errorMessage = signUpError.message.toLowerCase();

        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          setError(t('emailAlreadyRegistered') || 'This email is already registered. Please sign in instead.');
          toast.error(t('emailAlreadyRegistered') || 'Email already registered');
          setTimeout(() => router.push('/signin'), 2000);
        } else if (errorMessage.includes('invalid email')) {
          setError(t('invalidEmail') || 'Please enter a valid email address.');
        } else if (errorMessage.includes('password')) {
          setError(signUpError.message);
        } else {
          setError(signUpError.message || t('failedToCreateAccount') || 'Failed to create account. Please try again.');
        }
        clearSensitiveFields();
        setIsSubmitting(false);
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setError(t('emailAlreadyRegistered') || 'This email is already registered. Please sign in instead.');
        toast.error(t('emailAlreadyRegistered') || 'Email already registered');
        setTimeout(() => router.push('/signin'), 2000);
        clearSensitiveFields();
        setIsSubmitting(false);
        return;
      }

      // If we got a session immediately (email confirmation disabled), redirect to home
      if (data?.session) {
        toast.success(t('signUpSuccess') || 'Account created successfully! Welcome!');
        router.push('/');
        return;
      }

      // Email confirmation required - show modal instead of redirecting
      clearSensitiveFields();
      setVerificationEmail(formData.email);
      setShowVerificationModal(true);
      toast.success(t('checkYourEmail') || 'Check your email for the verification link!');
    } catch (err) {
      console.error('Signup error:', err);
      setError(t('unexpectedError') || 'An unexpected error occurred. Please try again.');
      clearSensitiveFields();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message || t('failedGoogleSignUp') || 'Failed to sign up with Google.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <>
      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        email={verificationEmail}
        onClose={() => setShowVerificationModal(false)}
        onResend={handleResendVerification}
        isResending={isResending}
        t={t}
      />

      <div className="min-h-screen grid lg:grid-cols-2 bg-white">
        <div className="relative hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/background-image.png')",
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 flex h-full flex-col justify-center px-14 text-white space-y-4">
          <h1 className="text-5xl font-normal leading-tight max-w-xl">
            {t('optimizeCareer')}
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed max-w-xl">
            {t('transformCV')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f7f9fb] px-6 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/assets/ai marker footer logo.svg"
              alt="ResumeAI"
              width={36}
              height={36}
            />
            <span className="text-xl text-gray-900 font-normal">ResumeAI</span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-4xl font-normal text-gray-900">
              {t('createAccount')}
            </h2>
            <p className="text-base text-gray-600">{t('signupSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-[#f7f9fb] rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-gray-700">{t('fullName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('enterFullName')}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-11 h-12 bg-gray-50 border-gray-200"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder={t('enterEmail')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-11 h-12 bg-gray-50 border-gray-200"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-11 pr-12 h-12 bg-gray-50 border-gray-200"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{t('passwordStrength')}</span>
                    <span className={`font-medium ${passwordStrength.level === 1 ? 'text-red-500' : passwordStrength.level === 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.level >= 1 ? (passwordStrength.level === 1 ? 'bg-red-500' : passwordStrength.level === 2 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.level >= 2 ? (passwordStrength.level === 2 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.level >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">{t('confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('reEnterPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-11 pr-12 h-12 bg-gray-50 border-gray-200"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                className="mt-1 border-gray-300"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                {t('agreeToTerms')}
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('creatingAccount') || 'Creating account...'}
                </>
              ) : (
                t('createAccountBtn')
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#f7f9fb] text-gray-500">{t('orSignUpWith')}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={isSubmitting}
              className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-800 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('continueWithGoogleSignUp')}
            </Button>

            <div className="text-center text-sm text-gray-700">
              {t('haveAccount')}{' '}
              <Link href="/signin" className="font-medium text-gray-900 hover:underline">
                {t('signIn')}
              </Link>
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
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
