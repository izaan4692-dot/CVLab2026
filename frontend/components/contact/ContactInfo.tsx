'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, MapPin } from 'lucide-react';

export default function ContactInfo() {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-50 rounded-lg p-8 space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('contact.contactInfo')}</h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('contact.email')}</h4>
              <p className="text-sm text-gray-600">support@seerazkia.com</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('contact.address')}</h4>
              <p className="text-sm text-gray-600">{t('contact.addressFull')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

