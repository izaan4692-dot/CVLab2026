'use client';

import { File } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ResumeInformationProps = {
  data: {
    id: string;
    user: string;
    originalFilename: string;
    created: string;
    fileSize: string;
    analyzed: boolean;
  };
};

export default function ResumeInformation({ data }: ResumeInformationProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <File className="w-5 h-5" />
          {t('admin.resumeInformation.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">
              {t('admin.resumeInformation.id')}
            </div>
            <div className="font-medium text-gray-900">{data.id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">
              {t('admin.resumeInformation.user')}
            </div>
            <div className="font-medium text-gray-900">{data.user}</div>
          </div>
          <div />

          <div>
            <div className="text-sm text-gray-500 mb-1">
              {t('admin.resumeInformation.originalFilename')}
            </div>
            <div className="font-medium text-gray-900">
              {data.originalFilename}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">
              {t('admin.resumeInformation.created')}
            </div>
            <div className="font-medium text-gray-900">{data.created}</div>
          </div>
          <div />

          <div>
            <div className="text-sm text-gray-500 mb-1">
              {t('admin.resumeInformation.fileSize')}
            </div>
            <div className="font-medium text-gray-900">{data.fileSize}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">
              {t('admin.resumeInformation.analyzed')}
            </div>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              {data.analyzed
                ? t('admin.resumeInformation.yes')
                : t('admin.resumeInformation.no')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


