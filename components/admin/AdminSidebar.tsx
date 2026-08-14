'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare } from 'lucide-react';
import ClaimsOverview from '@/components/admin/claims/ClaimsOverview';

type MenuItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: string;
};

export default function AdminSidebar() {
  const { t, language } = useLanguage();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      label: t('admin.dashboard'),
      href: '/admin/dashboard',
      customIcon: '/assets/total_sessions.svg',
    },
    {
      label: t('admin.prompts'),
      href: '/admin/prompts',
      icon: MessageSquare,
    },
    {
      label: t('admin.resumes'),
      href: '/admin/resumes',
      customIcon: '/assets/resume_processed.svg',
    },
    {
      label: t('admin.users'),
      href: '/admin/users',
      customIcon: '/assets/total_users.svg',
    },
    {
      label: t('admin.claims'),
      href: '/admin/claims',
      customIcon: '/assets/claims.svg',
    },
    {
      label: t('admin.settings'),
      href: '/admin/settings',
      customIcon: '/assets/settings.svg',
    },
  ];

  const isRTL = language === 'ar';

  return (
    <aside className={`w-56 bg-white border-r border-gray-200 h-screen overflow-y-auto ${isRTL ? 'border-l border-r-0' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin/dashboard" className="flex items-center justify-center">
          <Image
            src="/assets/Main_logo.svg"
            alt="CVLab Logo"
            width={200}
            height={200}
            className="h-20 w-auto"
          />
        </Link>
      </div>

      <nav className="space-y-1 px-4 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          const renderIcon = () => {
            if (item.customIcon) {
              // Apply dark filter to Claims and Settings icons to make them black
              const needsDarkFilter = item.href === '/admin/claims' || item.href === '/admin/settings';
              return (
                <Image
                  src={item.customIcon}
                  alt={item.label}
                  width={20}
                  height={20}
                  className="w-5 h-5 flex-shrink-0"
                  style={needsDarkFilter ? { filter: 'brightness(0)' } : undefined}
                />
              );
            }
            if (Icon) {
              // Prompts icon always black
              return <Icon className="w-5 h-5 flex-shrink-0 text-gray-900" />;
            }
            return null;
          };

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-bold'
                  : 'text-gray-700 hover:bg-gray-100 font-medium'
              }`}
              dir="ltr"
            >
              {isRTL ? (
                <>
                  <span className={`flex-1 text-left ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                  {renderIcon()}
                </>
              ) : (
                <>
                  {renderIcon()}
                  <span className={`flex-1 ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Claims Overview - Only show on Claims page */}
      {pathname === '/admin/claims' || pathname.startsWith('/admin/claims/') ? (
        <div className="px-4 py-4 border-t border-gray-200">
          <ClaimsOverview />
        </div>
      ) : null}
    </aside>
  );
}
