'use client';

import { CreditCard, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PaymentFormData } from '@/types/payment';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentFormProps {
  formData: PaymentFormData;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PaymentForm({
  formData,
  setFormData,
  onSubmit,
}: PaymentFormProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#1D1D1F] text-2xl font-semibold">
          {t('paymentDetails')}
        </h2>
        <div className="bg-[#FF3B30] text-white px-3 py-1 rounded-full flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-xs font-medium">{t('limitedOffer')}</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h3 className="text-[#1D1D1F] text-sm font-medium mb-4">
            {t('contactInformation')}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[#6E6E73] text-xs mb-2 block">
                {t('fullName')}
              </label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Abdullah Khan"
                className="bg-white border-[#E5E5EA] text-[#1D1D1F] placeholder:text-[#C7C7CC] rounded-lg h-12"
              />
            </div>
            <div>
              <label className="text-[#6E6E73] text-xs mb-2 block">
                {t('emailAddressLabel')}
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="abdullah@example.com"
                className="bg-white border-[#E5E5EA] text-[#1D1D1F] placeholder:text-[#C7C7CC] rounded-lg h-12"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[#1D1D1F] text-sm font-medium mb-4">
            {t('paymentMethod')}
          </h3>

          <div className="bg-[#F5F5F7] rounded-lg p-4 mb-4 flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1D1D1F]" />
            <span className="text-[#1D1D1F] text-sm font-medium">{t('card')}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[#6E6E73] text-xs mb-2 block">
                {t('cardNumber')}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className={`bg-white border-[#E5E5EA] text-[#1D1D1F] placeholder:text-[#C7C7CC] rounded-lg h-12 ${isRTL ? 'pl-20' : 'pr-20'}`}
                />
                <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}>
                  <Image
                    src="/payment_cards_image.png"
                    alt="Payment Cards"
                    width={71}
                    height={24}
                    className="h-6 w-auto"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#6E6E73] text-xs mb-2 block">
                  {t('expiryDate')}
                </label>
                <Input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  placeholder="MM/YY"
                  className="bg-white border-[#E5E5EA] text-[#1D1D1F] placeholder:text-[#C7C7CC] rounded-lg h-12"
                />
              </div>
              <div>
                <label className="text-[#6E6E73] text-xs mb-2 block">{t('cvc')}</label>
                <Input
                  type="text"
                  value={formData.cvc}
                  onChange={(e) => handleChange('cvc', e.target.value)}
                  placeholder="123"
                  className="bg-white border-[#E5E5EA] text-[#1D1D1F] placeholder:text-[#C7C7CC] rounded-lg h-12"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="save-card"
            checked={formData.saveCard}
            onCheckedChange={(checked) =>
              handleChange('saveCard', checked as boolean)
            }
            className="border-[#E5E5EA]"
          />
          <label
            htmlFor="save-card"
            className="text-[#6E6E73] text-sm cursor-pointer"
          >
            {t('saveCard')}
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-black hover:bg-[#1D1D1F] text-white rounded-xl h-14 text-base font-medium flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5" />
          {t('payOptimize')}
          <ArrowRight className="w-5 h-5" />
        </Button>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#6E6E73]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm">{t('securePayment')}</span>
          </div>
          <p className="text-[#6E6E73] text-xs">
            {t('noRecurring')}
          </p>
        </div>
      </form>
    </div>
  );
}

