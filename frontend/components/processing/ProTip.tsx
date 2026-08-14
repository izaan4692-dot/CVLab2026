'use client';

import { Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProTip() {
  const { t } = useLanguage();

  return (
    <div className="flex items-start gap-4 max-w-md">
      <div className="flex-shrink-0 bg-black rounded-xl p-3">
        <Lightbulb className="w-5 h-5 text-white" fill="white" />
      </div>
      <div className="flex-1">
        <h3 className="text-[#1D1D1F] text-sm font-medium mb-1">{t('proTipTitle')}</h3>
        <p className="text-[#6E6E73] text-sm leading-relaxed">
          {t('proTipText')}
        </p>
      </div>
    </div>
  );
}

