'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import AdminSectionHeader from '@/components/admin/resumes/SectionHeader';

export default function AdminPlaceholderPage({
  titleKey,
}: {
  titleKey: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminSectionHeader title={t(titleKey)} subtitle={t('admin.comingSoon')} />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg p-8">
          <p className="text-gray-700">{t('admin.comingSoon')}</p>
        </div>
      </div>
    </div>
  );
}


