'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import ResumesDashboardHeader from './ResumesDashboardHeader';
import ResumesDashboardTable from './ResumesDashboardTable';

export default function ResumesDashboardPage() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ResumesDashboardHeader />
          <ResumesDashboardTable />
        </div>
      </div>
    </div>
  );
}


