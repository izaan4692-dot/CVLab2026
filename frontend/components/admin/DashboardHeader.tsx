'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import NotificationDropdown from '@/components/admin/NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getAdminSectionLabel(pathname: string, t: (key: string) => string) {
  if (pathname.startsWith('/admin/overview')) return t('admin.overview');
  if (pathname.startsWith('/admin/prompts')) return t('admin.prompts');
  if (pathname.startsWith('/admin/resumes')) return t('admin.resumes');
  if (pathname.startsWith('/admin/users')) return t('admin.users');
  if (pathname.startsWith('/admin/claims')) return t('admin.claims');
  if (pathname.startsWith('/admin/settings')) return t('admin.settings');
  if (pathname.startsWith('/admin/dashboard')) return t('admin.dashboard');
  return t('admin.dashboard');
}

export default function DashboardHeader() {
  const { t, language } = useLanguage();
  const { user, signOut } = useAdminAuth();
  const router = useRouter();
  const isArabic = language === 'ar';
  const pathname = usePathname();
  const sectionLabel = getAdminSectionLabel(pathname, t);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Get user display info
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'System Administrator';
  const userEmail = user?.email || 'admin@cvlab.sa';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SA';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/signin?redirect=/admin');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      {/* Top AdminHub brand + breadcrumb row (same as prompts page) */}
      <div
        className={`flex items-center justify-between ${
          isArabic ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`flex items-center gap-3 ${
            isArabic ? 'flex-row-reverse' : ''
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-black overflow-hidden">
            <Image
              src="/assets/admin_logo.png"
              alt="AdminHub logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {t('pm.brand')}
          </span>
          <div
            className={`flex items-center gap-2 text-xs text-gray-600 ${
              isArabic ? 'flex-row-reverse' : ''
            }`}
          >
            <span>{t('pm.nav.admin')}</span>
            <span>&gt;</span>
            <span>{sectionLabel}</span>
          </div>
        </div>

        <div
          className={`flex items-center gap-6 ${
            isArabic ? 'flex-row-reverse' : ''
          }`}
        >
          <NotificationDropdown />

          <LanguageSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{userInitials}</span>
            </div>
            <div className={isArabic ? 'text-right' : ''}>
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isArabic ? 'start' : 'end'} className="w-56">
              <DropdownMenuItem disabled className="opacity-100">
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-gray-500">{userEmail}</span>
          </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                disabled={isSigningOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page title + subtitle row */}
      <div className={`mt-4 ${isArabic ? 'text-right' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900">
          {pathname.startsWith('/admin/resumes') 
            ? t('admin.dashboard.resumesTitle')
            : t('admin.dashboardOverview')}
        </h2>
        <p className="text-gray-600 text-sm">
          {pathname.startsWith('/admin/resumes')
            ? t('admin.dashboard.resumesSubtitle')
            : t('admin.monitorPerformance')}
        </p>
      </div>
    </header>
  );
}
