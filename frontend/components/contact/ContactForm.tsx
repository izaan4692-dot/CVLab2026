'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Send, ShieldCheck } from 'lucide-react';

export default function ContactForm() {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-50 rounded-lg p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('contact.sendMessage')}</h3>
        <p className="text-sm text-gray-600">{t('contact.replyTime')}</p>
      </div>

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t('contact.fullName')}
          </label>
          <input
            type="text"
            placeholder={t('contact.fullNamePlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t('contact.email')}
          </label>
          <input
            type="email"
            placeholder={t('contact.emailPlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t('contact.phoneNumber')}
          </label>
          <input
            type="tel"
            placeholder={t('contact.phonePlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t('contact.message')}
          </label>
          <textarea
            rows={6}
            placeholder={t('contact.messagePlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Send className="w-5 h-5" />
          {t('contact.sendBtn')}
        </button>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <ShieldCheck className="w-4 h-4" />
          <span>{t('contact.confidential')}</span>
        </div>
      </form>
    </div>
  );
}

