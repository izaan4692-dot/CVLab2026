'use client';

import { FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ExtractedTextPreviewProps = {
  text: string;
};

export default function ExtractedTextPreview({ text }: ExtractedTextPreviewProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5" />
          {t('admin.extractedText.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
              {text}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


