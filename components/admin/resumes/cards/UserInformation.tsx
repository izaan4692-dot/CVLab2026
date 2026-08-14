'use client';

import { User, Mail, Hash, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type UserInformationProps = {
  data: {
    email: string;
    requestNumber: string;
    status: 'active' | 'inactive';
  };
};

export default function UserInformation({ data }: UserInformationProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5" />
          {t('admin.userInformation.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t('admin.userInformation.email')}
              </div>
              <div className="font-medium text-gray-900">{data.email}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Hash className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t('admin.userInformation.requestNumber')}
              </div>
              <div className="font-medium text-gray-900">
                {data.requestNumber}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Info className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t('admin.userInformation.status')}
              </div>
              <Badge className={
                data.status === 'active'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
              }>
                {data.status === 'active' 
                  ? t('admin.userInformation.active')
                  : t('admin.inactive')
                }
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


