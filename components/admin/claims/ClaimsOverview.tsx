'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getClaimStats, ClaimStats } from '@/lib/admin-api';
import { Loader2 } from 'lucide-react';

export default function ClaimsOverview() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await getClaimStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className={`text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : ''}`}>
          {t('claims.overview')}
        </h3>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className={`text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : ''}`}>
          {t('claims.overview')}
        </h3>
        <p className={`text-sm text-red-600 ${isRTL ? 'text-right' : ''}`}>{error}</p>
      </div>
    );
  }

  const statItems = stats ? [
    {
      label: t('claims.openClaims'),
      value: stats.open_claims,
      color: 'text-red-600',
    },
    {
      label: t('claims.inReview'),
      value: stats.in_review,
      color: 'text-amber-600',
    },
    {
      label: t('claims.resolved'),
      value: stats.resolved,
      color: 'text-green-600',
    },
  ] : [];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className={`text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : ''}`}>
        {t('claims.overview')}
      </h3>

      <div className="space-y-4">
        {statItems.map((stat, index) => (
          <div key={index} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : ''}`}>{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
