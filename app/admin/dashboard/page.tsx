'use client';

import React from 'react';
import DashboardHeader from '@/components/admin/DashboardHeader';
import StatsCards from '@/components/admin/StatsCards';
import UserManagementTable from '@/components/admin/UserManagementTable';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminDashboardPage() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="flex flex-col h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader />
      <div className="flex-1 overflow-auto p-8 space-y-8">
        <StatsCards />
        <UserManagementTable />
      </div>
    </div>
  );
}
