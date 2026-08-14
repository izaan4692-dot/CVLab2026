'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Languages className="w-4 h-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        {language === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}

