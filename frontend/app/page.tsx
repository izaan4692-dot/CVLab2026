'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

// Success modal for email verification
function EmailVerifiedModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">
            You're In!
          </h3>

          <p className="text-gray-600">
            Your email has been verified. Welcome to ResumeAI!
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-colors mt-6"
          >
            Let's Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationHandler({ onVerified }: { onVerified: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      onVerified();
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams, onVerified]);

  return null;
}

export default function Home() {
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const { t } = useLanguage();

  const handleVerified = () => {
    setShowVerifiedModal(true);
    toast.success('Email verified successfully!');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Email Verified Modal */}
      <EmailVerifiedModal
        isOpen={showVerifiedModal}
        onClose={() => setShowVerifiedModal(false)}
      />

      <Suspense fallback={null}>
        <VerificationHandler onVerified={handleVerified} />
      </Suspense>
      <Header />

      {/* Language Switcher - Right aligned, below header */}
      <div className="flex justify-end px-6 pt-1">
        <LanguageSwitcher />
      </div>

      {/* Main Content - Original vertical layout: Hero first, then How It Works */}
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
}