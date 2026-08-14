'use client';

import { useState } from 'react';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
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

export default function PromptManagementHeader() {
  const { language, t } = useLanguage();
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
    <header className="border-b border-gray-200 bg-white px-6 py-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3" dir="ltr">
          <span className="text-sm font-semibold text-gray-900">
            {t('pm.brand')}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{t('pm.nav.admin')}</span>
            <span>&gt;</span>
            <span>{sectionLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-6" dir="ltr">
          <NotificationDropdown />

          {isArabic ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{userInitials}</span>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">
                        {userName}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="opacity-100">
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{userName}</span>
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

              <div className="border-l border-gray-200 pl-4">
                <LanguageSwitcher />
              </div>
            </>
          ) : (
            <>
              <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{userInitials}</span>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">
                        {userName}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="opacity-100">
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{userName}</span>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}


