'use client';

import { Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';

export default function PaymentHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-white border-b border-[#E5E5EA]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-black rounded-xl p-2">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#1D1D1F] text-xl font-semibold">
            ResumeAI
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          <div className="flex items-center gap-2 text-[#6E6E73]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t('secureCheckout')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

