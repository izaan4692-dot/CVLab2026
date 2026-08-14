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
    <header className="border-b border-gray-200 bg-white px-6 py-4">
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
          <div className="flex items-center gap-3">
            <NotificationDropdown />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer ${
                isArabic ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                {userInitials}
              </div>
              <div className={`hidden sm:block ${isArabic ? 'text-right' : ''}`}>
                <div className="text-xs font-medium text-gray-900">
                  {userName}
                </div>
                <div className="text-xs text-gray-500">{userEmail}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-600" />
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

          <div className={`${isArabic ? 'border-r' : 'border-l'} border-gray-200 ${isArabic ? 'pr-6' : 'pl-6'}`}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}


