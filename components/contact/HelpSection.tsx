'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, BookOpen, Headphones } from 'lucide-react';

export default function HelpSection() {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Headphones className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">{t('contact.needHelp')}</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          {t('contact.supportText')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 border border-gray-200 font-medium">
            <MessageCircle className="w-5 h-5" />
            {t('contact.liveChat')}
          </button>
          <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium">
            <BookOpen className="w-5 h-5" />
            {t('contact.helpCenter')}
          </button>
        </div>
      </div>
    </div>
  );
}

