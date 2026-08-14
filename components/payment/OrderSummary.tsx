'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { PRICING } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OrderSummary() {
  const { t } = useLanguage();

  const optimizations = [
    {
      iconSrc: '/assets/ATS Optimization.svg',
      labelKey: 'atsOptimization',
      checked: true,
    },
    {
      iconSrc: '/assets/Grammar_Clarity.svg',
      labelKey: 'grammarClarity',
      checked: true,
    },
    {
      iconSrc: '/assets/Keyword Enhancement.svg',
      labelKey: 'keywordEnhancement',
      checked: true,
    },
    {
      iconSrc: '/assets/Professional Formatting.svg',
      labelKey: 'professionalFormatting',
      checked: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm h-fit">
      <h2 className="text-[#1D1D1F] text-2xl font-semibold mb-6">
        {t('orderSummary')}
      </h2>

      <div className="space-y-6">
        <div>
          <p className="text-[#6E6E73] text-sm mb-4">{t('aiWillOptimize')}</p>
          <div className="space-y-3">
            {optimizations.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Image
                    src={item.iconSrc}
                    alt={t(item.labelKey)}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                </div>
                <span className="text-[#1D1D1F] text-sm flex-1">
                  {t(item.labelKey)}
                </span>
                {item.checked && (
                  <Check className="w-4 h-4 text-[#1D1D1F] flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#E5E5EA] pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#6E6E73] text-base">
              {t('resumeOptimization')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#6E6E73] text-sm line-through">
                ${PRICING.originalPrice}
              </span>
              <span className="text-[#1D1D1F] text-base font-semibold">
                ${PRICING.discountedPrice}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
            <span className="text-[#1D1D1F] text-lg font-semibold">{t('total')}</span>
            <span className="text-[#1D1D1F] text-lg font-semibold">
              ${PRICING.discountedPrice}
            </span>
          </div>
        </div>

        <div className="bg-[#F5F5F7] rounded-xl p-4">
          <p className="text-[#6E6E73] text-xs leading-relaxed">
            {t('readyForOptimization')}
          </p>
        </div>
      </div>
    </div>
  );
}
