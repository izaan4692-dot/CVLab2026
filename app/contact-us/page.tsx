'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactInfo from '@/components/contact/ContactInfo';
import FAQSection from '@/components/contact/FAQSection';
import ContactForm from '@/components/contact/ContactForm';

export default function ContactUsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-semibold text-gray-900 mb-4">{t('contact.title')}</h1>
            <p className="text-lg text-gray-600">{t('contact.subtitle')}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <ContactInfo />
              <FAQSection />
            </div>
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

