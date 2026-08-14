'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, User, Loader2 } from 'lucide-react';
import UserNotificationDropdown from '@/components/user/UserNotificationDropdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile';
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setShowSignOutDialog(false);
      toast.success(t('signOutSuccess') || 'You have been signed out successfully.');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('signOutError') || 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Get user info from Supabase user object
  const fullName = user?.user_metadata?.full_name || '';
  const firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const userName = fullName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userInitial = firstName.charAt(0).toUpperCase();

  return (
    <>
      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <LogOut className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              {t('signOutConfirmTitle') || 'Sign Out'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('signOutConfirmMessage') || 'Are you sure you want to sign out of your account?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSignOutDialog(false)}
              disabled={isSigningOut}
              className="flex-1"
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('signingOut') || 'Signing out...'}
                </>
              ) : (
                t('signOut') || 'Sign Out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-50 w-full bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center flex-shrink-0">
              {pathname === '/contact-us' || pathname === '/profile' ? (
                <div className="flex items-center gap-3">
                  <div className="bg-black rounded-xl p-2">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-900">
                    ResumeAI
                  </span>
                </div>
              ) : (
                <Image
                  src="/assets/latest-logo.svg"
                  alt="CVLab Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              )}
            </Link>

            <nav className="hidden md:flex items-center gap-12">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 transition-colors text-base font-normal"
              >
                {t('home')}
              </Link>
              <Link
                href="/terms-of-service"
                className="text-gray-700 hover:text-gray-900 transition-colors text-base font-normal"
              >
                {t('termsOfService')}
              </Link>
              <Link
                href="/about-us"
                className="text-gray-700 hover:text-gray-900 transition-colors text-base font-normal"
              >
                {t('about')}
              </Link>
              <Link
                href="/contact-us"
                className="text-gray-700 hover:text-gray-900 transition-colors text-base font-normal"
              >
                {t('contact')}
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {loading ? (
                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-lg" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  {/* Notifications */}
                  <UserNotificationDropdown />
                  
                  {/* User Profile Section */}
                  <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                          {userInitial}
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{userName}</p>
                      <p className="text-xs text-gray-500 leading-tight">{userEmail}</p>
                    </div>
                  </Link>

                  {/* Sign Out Button */}
                  <Button
                    onClick={() => setShowSignOutDialog(true)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/signin">
                    <Button variant="ghost" className="h-10 px-6 text-gray-700 hover:text-gray-900 font-normal">
                      {t('signIn')}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="h-10 px-6 bg-black hover:bg-gray-800 text-white rounded-lg font-normal">
                      {t('getStarted')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
