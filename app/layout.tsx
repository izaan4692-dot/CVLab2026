import './globals.css';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ResumeAI - Optimize Your Career',
  description: 'Transform your resume with intelligent optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            {children}
            <Toaster position="top-center" richColors />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
