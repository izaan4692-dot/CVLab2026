'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

export default function FAQSection() {
  const { t } = useLanguage();

  const faqs = [
    { id: 1, question: t('contact.faq1') },
    { id: 2, question: t('contact.faq2') },
    { id: 3, question: t('contact.faq3') },
  ];

  return (
    <div className="bg-white rounded-lg p-8 mt-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('contact.faq')}</h3>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="flex items-start gap-3">
            <Image
              src="/assets/contact-us-tick.svg"
              alt="FAQ"
              width={16}
              height={16}
              className="w-4 h-4 mt-0.5 flex-shrink-0"
            />
            <p className="text-sm text-gray-900">{faq.question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
