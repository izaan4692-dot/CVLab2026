'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function FAQSection() {
  const { t } = useLanguage();

  const faqs = [
    { id: 1, question: t('contact.faq1') },
    { id: 2, question: t('contact.faq2') },
    { id: 3, question: t('contact.faq3') },
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-8 mt-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('contact.faq')}</h3>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
            <p className="text-sm text-gray-900">{faq.question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

