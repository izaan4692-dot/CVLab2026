'use client';

import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AIOptimizationStatusProps = {
  data: {
    status: string;
    dataPreview: string;
  };
};

export default function AIOptimizationStatus({ data }: AIOptimizationStatusProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5" />
            {t('admin.aiOptimization.title')}
          </CardTitle>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            {t('admin.aiOptimization.optimized')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4">
          {t('admin.aiOptimization.description')}
        </p>

        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {t('admin.aiOptimization.dataPreview')}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
              {data.dataPreview}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


