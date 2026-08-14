'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, error, user } = useAdminAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) {
      return;
    }

    // Add timeout fallback - if loading takes too long, redirect to signin
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('[AdminLayout] Admin check taking too long, redirecting to signin');
        router.push('/signin?redirect=/admin');
      }
    }, 15000); // 15 second timeout

    // Only redirect after loading is complete
    if (!user) {
      console.log('[AdminLayout] No user, redirecting to signin');
      clearTimeout(timeoutId);
      router.push('/signin?redirect=/admin');
    } else if (user && !isAdmin) {
      console.log('[AdminLayout] User is not admin, redirecting to home');
      clearTimeout(timeoutId);
      router.push('/');
    } else if (user && isAdmin) {
      console.log('[AdminLayout] User is admin, allowing access');
      clearTimeout(timeoutId);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, user, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-600">Verifying admin access...</p>
          <p className="text-xs text-gray-400 mt-2">
            If this takes too long, please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-700 font-medium">Authentication Error</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-yellow-50 p-6 text-center">
          <p className="text-yellow-700 font-medium">Access Denied</p>
          <p className="text-yellow-600 text-sm mt-2">
            You do not have permission to access the admin panel.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <AdminSidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
