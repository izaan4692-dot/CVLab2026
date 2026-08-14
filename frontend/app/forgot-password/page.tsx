'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { resetPassword, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t('emailRequired') || 'Please enter your email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('user not found') || errorMessage.includes('no user')) {
          setError(t('userNotFound') || 'No account found with this email address.');
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          setError(t('tooManyAttempts') || 'Too many attempts. Please try again later.');
        } else {
          setError(error.message || t('resetPasswordFailed') || 'Failed to send reset email. Please try again.');
        }
      } else {
        setEmailSent(true);
        toast.success(t('resetEmailSent') || 'Password reset email sent!');
      }
    } catch {
      setError(t('unexpectedError') || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // Success state - email sent
  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f9fb]">
        {/* Header */}
        <header className="p-6">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <Image
              src="/assets/ai marker footer logo.svg"
              alt="ResumeAI"
              width={32}
              height={32}
            />
            <span className="text-lg text-gray-900 font-normal">ResumeAI</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 pb-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-lg w-full text-center space-y-8">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-gray-900">
                {t('checkYourInbox') || 'Check Your Inbox'}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('resetLinkOnWay') || "We've sent you an email with a link to reset your password:"}
              </p>
              <p className="font-semibold text-gray-900 text-lg break-all">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-left space-y-3">
              <h3 className="font-medium text-blue-900">
                {t('hereIsWhatToDo') || "Here's what to do:"}
              </h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>{t('step1OpenEmail') || 'Open your email (check spam if needed)'}</li>
                <li>{t('step2ClickResetLink') || 'Click the reset link in the email'}</li>
                <li>{t('step3PickNewPassword') || 'Pick a new password and you\'re all set!'}</li>
              </ol>
            </div>

            {/* Resend / Try again */}
            <div className="space-y-4 pt-2">
              <p className="text-sm text-gray-500">
                {t('wrongEmailQuestion') || "Wrong email or didn't get it?"}
              </p>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50"
              >
                {t('tryDifferentEmail') || 'Try a different email'}
              </Button>
            </div>

            {/* Back to Sign In */}
            <div className="pt-4 border-t border-gray-100">
              <Link
                href="/signin"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToSignIn') || 'Back to Sign In'}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left visual panel */}
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
            {t('forgotPasswordHero') || 'Forgot Your Password?'}
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed max-w-xl">
            {t('noWorriesHappen') || "No worries, it happens! We'll help you get back into your account in no time."}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-[#f7f9fb] px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
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
              {t('resetPasswordTitle') || 'Reset Password'}
            </h2>
            <p className="text-base text-gray-600">
              {t('enterEmailToReset') || "Enter your email and we'll send you a link to create a new password."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-[#f7f9fb] rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-gray-700">
                {t('emailAddress') || 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder={t('enterEmail') || 'Enter your email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-gray-50 border-gray-200"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('sendingLink') || 'Sending...'}
                </>
              ) : (
                t('sendMeResetLink') || 'Send Me a Reset Link'
              )}
            </Button>

            <div className="text-center pt-4">
              <Link
                href="/signin"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToSignIn') || 'Back to Sign In'}
              </Link>
            </div>
          </form>

          <div className="text-center text-sm text-gray-600">
            {t('dontHaveAccount') || "Don't have an account?"}{' '}
            <Link href="/signup" className="font-medium text-gray-900 hover:underline">
              {t('signUp') || 'Sign Up'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
