'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, LogOut, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import UserNotificationDropdown from '@/components/user/UserNotificationDropdown';

export default function ResumePreviewHeader() {
  const { language, t } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isRTL = language === 'ar';

  // Get user info from Supabase user object
  const fullName = user?.user_metadata?.full_name || '';
  const firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const userName = fullName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userInitial = firstName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Left side - Logo and brand */}
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">ResumeAI</span>
          </div>

          {/* Right side - Notifications, Profile, Logout */}
          <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Notifications */}
            <UserNotificationDropdown />

            {/* Profile section */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
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
                    {userInitial}
                  </div>
                )}
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>

            {/* Logout link */}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
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

