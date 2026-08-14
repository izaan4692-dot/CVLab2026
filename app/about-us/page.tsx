'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, Target, HelpCircle, FileEdit } from 'lucide-react';
import Image from 'next/image';

export default function AboutUsPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="flex flex-col min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('aboutUsTitle')}
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              {t('aboutUsSubtitle')}
            </p>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="pt-0 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {t('aboutUsWhoWeAreTitle')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('aboutUsWhoWeAreText')}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-2 mb-12">
              <h2 className="text-4xl font-bold text-gray-900">
                {t('aboutUsHowItWorksTitle')}
              </h2>
              <p className="text-base text-gray-600">{t('aboutUsHowItWorksSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Image 
                    src="/assets/upload icon.png"
                    alt="Upload"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    1. {t('aboutUsStep1Title')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsStep1Desc')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Image 
                    src="/assets/ai analyses brain icon.png"
                    alt="AI Analysis"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    2. {t('aboutUsStep2Title')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsStep2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <HelpCircle className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    3. {t('aboutUsStep3Title')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsStep3Desc')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <FileEdit className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    4. {t('aboutUsStep4Title')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsStep4Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-bold text-gray-900">
                  {t('aboutUsMissionTitle')}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('aboutUsMissionText')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
