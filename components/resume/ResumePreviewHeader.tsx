'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import UserNotificationDropdown from '@/components/user/UserNotificationDropdown';

export default function ResumePreviewHeader() {
  const { language, t } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isRTL = language === 'ar';

  // Get user info from Supabase user object
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and brand */}
          <div className="flex items-center" dir="ltr">
            <Image
              src="/assets/Main_logo.svg"
              alt="CVLab Logo"
              width={200}
              height={200}
              className="h-20 w-auto"
            />
          </div>

          {/* Right side - Profile, Notifications, Logout */}
          <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Profile section */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black text-white text-sm font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{userName}</p>
              </div>
            </div>

            {/* Notification dropdown */}
            <UserNotificationDropdown />

            {/* Logout link */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>{t('signOut') || 'Logout'}</span>
              <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

