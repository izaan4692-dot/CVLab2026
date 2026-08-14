'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image 
                src="/assets/ai marker footer logo.svg"
                alt="ResumeAI Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="font-normal text-base">{t('resumeAI')}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('perfectingResumes')}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-normal text-white text-sm">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about-us"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-normal text-white text-sm">{t('legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('privacyPolicy')}
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('termsOfService')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex justify-between items-center">
          <p className="text-gray-400 text-sm">{t('copyright')}</p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
