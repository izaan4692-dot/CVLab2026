'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';

export default function PaymentHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-white border-b border-[#E5E5EA]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/assets/Main_logo.svg"
            alt="CVLab Logo"
            width={200}
            height={200}
            className="h-20 w-auto"
          />
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <div className="flex items-center gap-2 text-[#6E6E73]">
            <Image
              src="/assets/contact-us-shield.svg"
              alt="Shield"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">
              {t('secureCheckout')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
