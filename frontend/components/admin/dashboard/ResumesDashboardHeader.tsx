'use client';

import { Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';

export default function ResumesDashboardHeader() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div
      className={`mb-6 flex items-center justify-end ${
        isRTL ? 'flex-row-reverse' : ''
      }`}
    >
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <LanguageSwitcher />
        <button
          className={`flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 ${
            isRTL ? 'flex-row-reverse' : ''
          }`}
          type="button"
        >
          <Download size={16} />
          <span>{t('admin.dashboard.exportToExcel')}</span>
        </button>
      </div>
    </div>
  );
}


