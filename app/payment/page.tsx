'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentHeader from '@/components/payment/PaymentHeader';
import OrderSummary from '@/components/payment/OrderSummary';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormData } from '@/types/payment';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PaymentPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState<PaymentFormData>({
    fullName: 'Abdullah Khan',
    email: 'abdullah@example.com',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    saveCard: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Payment submitted:', formData);
    // Route to processing page to wait for analysis and questions
    router.push('/processing?mode=analysis');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <PaymentHeader />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-[#1D1D1F] text-4xl font-semibold mb-4">
            {t('paymentTitle')}
          </h1>
          <p className="text-[#6E6E73] text-base max-w-2xl mx-auto leading-relaxed">
            {t('paymentDescription')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <OrderSummary />
          <PaymentForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

