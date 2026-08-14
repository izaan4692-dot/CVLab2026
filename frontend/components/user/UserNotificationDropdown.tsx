'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, FileText, XCircle, Loader } from 'lucide-react';
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
import { 
  getUserNotifications, 
  markUserNotificationRead, 
  markAllUserNotificationsRead,
  UserNotification 
} from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

const POLL_INTERVAL = 30000; // 30 seconds

export default function UserNotificationDropdown() {
  const { t } = useLanguage();
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
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'resume_optimized':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'resume_failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'resume_processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            No notifications
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
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
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
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

