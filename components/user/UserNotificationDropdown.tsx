'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, FileText, AlertCircle, CreditCard, User, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getUserNotifications, markUserNotificationRead, markAllUserNotificationsRead, UserNotification } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const POLL_INTERVAL = 30000; // 30 seconds

export default function UserNotificationDropdown() {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserNotifications(10); // Get latest 10 notifications
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Set empty state on error to prevent UI issues
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: UserNotification) => {
    // Close dropdown immediately for better UX
    setOpen(false);

    // Mark as read if not already read (don't await to avoid blocking navigation)
    if (!notification.is_read) {
      markUserNotificationRead(notification.id).then(() => {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }).catch(error => {
        console.error('Failed to mark notification as read:', error);
      });
    }

    // Navigate based on notification type
    // Use setTimeout to ensure dropdown closes before navigation
    setTimeout(() => {
      if (notification.type === 'resume_optimized' && notification.related_id) {
        // Store resume ID in sessionStorage and navigate to preview
        sessionStorage.setItem('resumeId', notification.related_id);
        router.push('/resume-preview');
      } else if (notification.type === 'resume_failed' && notification.related_id) {
        // Navigate to upload page to try again
        router.push('/');
      } else if (notification.type === 'resume_processing' && notification.related_id) {
        // Navigate to processing page
        sessionStorage.setItem('resumeId', notification.related_id);
        router.push('/processing');
      }
    }, 100);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllUserNotificationsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'resume_optimized':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'resume_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'resume_processing':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'payment_success':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'payment_failed':
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case 'account_updated':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'welcome':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">{t('notifications.title') || 'Notifications'}</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {t('notifications.markAllRead') || 'Mark all as read'}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            {t('notifications.loading') || 'Loading notifications...'}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            {t('notifications.noNotifications') || 'No notifications'}
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={(e) => {
                  // Prevent default close behavior - we'll close manually after navigation
                  e.preventDefault();
                  handleNotificationClick(notification);
                }}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { 
                      addSuffix: true,
                      locale: isArabic ? ar : undefined
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



