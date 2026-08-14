'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminSectionHeader from '@/components/admin/resumes/SectionHeader';
import UserManagementTable from '@/components/admin/UserManagementTable';

export default function UsersPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSectionHeader
        title={t('admin.users.pageTitle')}
        subtitle={t('admin.users.pageSubtitle')}
      />

      <div className="max-w-7xl mx-auto p-8">
        <UserManagementTable showTitle={false} />
      </div>
    </div>
  );
}


