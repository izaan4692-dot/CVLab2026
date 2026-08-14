'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

export default function ContactInfo() {
  const { t, language } = useLanguage();

  return (
    <div className="bg-white rounded-lg p-8 space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('contact.contactInfo')}</h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image
                src="/assets/contact-us-email.svg"
                alt="Email"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('contact.email')}</h4>
              <p className="text-sm text-gray-600">support@smartcv.com</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image
                src="/assets/contact-us-address.svg"
                alt="Address"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('contact.address')}</h4>
              <p className="text-sm text-gray-600">{language === 'ar' ? 'الرياض،' : 'Riyadh,'}</p>
              <p className="text-sm text-gray-600">{language === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
