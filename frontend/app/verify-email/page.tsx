'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const { user, loading: authLoading, resendConfirmationEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Get email from URL params - redirect to signup if no email
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      // No email provided - redirect to signup
      router.push('/signup');
    }
  }, [searchParams, router]);

  // If user becomes authenticated (verified in another tab), redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      toast.success('Email verified successfully! Welcome!');
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);
    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        toast.error('Failed to resend email. Please try again.');
      } else {
        toast.success('Confirmation email sent! Check your inbox.');
        setResendCooldown(60);
      }
    } catch {
      toast.error('Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  if (authLoading || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

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
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-gray-900">
              Check Your Email
            </h1>
            <p className="text-gray-600 text-lg">
              You're almost there! We sent a confirmation email to:
            </p>
            <p className="font-semibold text-gray-900 text-lg break-all">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-left space-y-3">
            <h3 className="font-medium text-blue-900">
              Just one more step:
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Open your email inbox (check spam too)</li>
              <li>Click the confirmation link we sent you</li>
              <li>You'll be signed in automatically</li>
            </ol>
          </div>

          {/* Resend Section */}
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-500">
              No email yet? It can take a minute.
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              variant="outline"
              className="w-full h-12 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Confirmation Email
                </>
              )}
            </Button>
          </div>

          {/* Back to Sign Up */}
          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/signup"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign Up
            </Link>
          </div>

          {/* Already verified hint */}
          <div className="text-sm text-gray-500">
            Already confirmed your email?{' '}
            <Link href="/signin" className="text-gray-900 font-medium hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
