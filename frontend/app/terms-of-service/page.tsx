'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const sections = [
    { title: 'termsSection1Title', text: 'termsSection1Text' },
    { title: 'termsSection2Title', text: 'termsSection2Text' },
    { title: 'termsSection3Title', text: 'termsSection3Text' },
    { title: 'termsSection4Title', text: 'termsSection4Text' },
    { title: 'termsSection5Title', text: 'termsSection5Text' },
    { title: 'termsSection6Title', text: 'termsSection6Text' },
    { title: 'termsSection7Title', text: 'termsSection7Text' },
    { title: 'termsSection8Title', text: 'termsSection8Text' },
    { title: 'termsSection9Title', text: 'termsSection9Text' },
    { title: 'termsSection10Title', text: 'termsSection10Text' },
    { title: 'termsSection11Title', text: 'termsSection11Text' },
    { title: 'termsSection12Title', text: 'termsSection12Text' },
    { title: 'termsSection13Title', text: 'termsSection13Text' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <div className="flex justify-end px-6 pt-1">
        <LanguageSwitcher />
      </div>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('termsTitle')}
            </h1>
            <p className="text-base text-gray-600 mb-2">
              {t('termsSubtitle')}
            </p>
            <p className="text-sm text-gray-500">
              {t('termsLastUpdated')}
            </p>
          </div>
        </section>

        {/* Terms Content */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t(section.title)}
                  </h2>
                  <div className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
                    {t(section.text)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
