'use client';

import AdminSectionHeader from '@/components/admin/resumes/SectionHeader';
import SettingsPage from '@/components/admin/SettingsPage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSectionHeader
        title={t('admin.settings.title')}
        subtitle={t('admin.settings.subtitle')}
      />
      <div className="max-w-4xl mx-auto p-8">
        <SettingsPage />
      </div>
    </div>
  );
}
