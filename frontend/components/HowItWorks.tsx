'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      iconSrc: '/assets/upload icon.png',
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      iconSrc: '/assets/ai analyses brain icon.png',
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      iconSrc: '/assets/dowload icon.png',
      title: t('step3Title'),
      description: t('step3Desc'),
    },
  ];

  return (
    <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-4xl font-normal text-gray-900">
            {t('howItWorks')}
          </h2>
          <p className="text-base text-gray-600">{t('stepSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            return (
              <div key={index} className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Image 
                    src={step.iconSrc}
                    alt={step.title}
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
