'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading, supabase } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (password.length === 0) return { level: 0, label: '' };
    if (password.length < 6) return { level: 1, label: t('weak') || 'Weak' };
    if (password.length < 10) return { level: 2, label: t('good') || 'Good' };
    return { level: 3, label: t('strong') || 'Strong' };
  }, [password, t]);

  // Check if user has a valid recovery session
  useEffect(() => {
    // If not loading and no user, redirect to forgot-password
    // This means the recovery link was invalid or expired
    if (!authLoading && !user) {
      toast.error(t('invalidResetLink') || 'Invalid or expired reset link. Please request a new one.');
      router.push('/forgot-password');
    }
  }, [user, authLoading, router, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t('passwordTooShort') || 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('same')) {
          setError(t('samePassword') || 'New password cannot be the same as your old password.');
        } else {
          setError(error.message || t('resetPasswordFailed') || 'Failed to reset password. Please try again.');
        }
      } else {
        setResetSuccess(true);
        toast.success(t('passwordResetSuccess') || 'Password reset successfully!');
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

  // Success state
  if (resetSuccess) {
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
                {t('youreAllSet') || "You're All Set!"}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('passwordChangedSuccess') || "Your password has been changed. You're now signed in and ready to go."}
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => router.push('/')}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg"
            >
              {t('continueToHome') || 'Continue to Home'}
            </Button>

            <div className="text-sm text-gray-500">
              {t('welcomeBack') || 'Welcome back!'}
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
            {t('pickNewPassword') || 'Pick a New Password'}
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed max-w-xl">
            {t('makeItStrong') || 'Make it something secure that you can remember.'}
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
              {t('createYourNewPassword') || 'Create Your New Password'}
            </h2>
            <p className="text-base text-gray-600">
              {t('chooseSecurePassword') || 'Choose something secure with at least 6 characters.'}
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
                {t('newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('enterNewPassword') || 'Enter new password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-12 h-12 bg-gray-50 border-gray-200"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{t('passwordStrength') || 'Password Strength'}</span>
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
              <label className="text-sm text-gray-700">
                {t('confirmNewPassword') || 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('reEnterNewPassword') || 'Re-enter new password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('savingPassword') || 'Saving...'}
                </>
              ) : (
                t('saveNewPassword') || 'Save New Password'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
