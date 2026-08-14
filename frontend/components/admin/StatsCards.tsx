'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '@/lib/admin-api';

interface Stat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

const REFRESH_INTERVAL = 30000; // 30 seconds auto-refresh

export default function StatsCards() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  const statItems: Stat[] = stats
    ? [
        {
          label: t('admin.serverUptime'),
          value: stats.server_uptime,
          icon: (
            <Image
              src="/assets/dashboard-icons/server-uptime.png"
              alt="Server Uptime"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          ),
        },
        {
          label: t('admin.resumesProcessed'),
          value: formatNumber(stats.resumes_processed),
          icon: (
            <Image
              src="/assets/dashboard-icons/resumes-proceed.png"
              alt="Resumes Processed"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          ),
        },
        {
          label: t('admin.totalSessions'),
          value: formatNumber(stats.total_sessions),
          icon: (
            <Image
              src="/assets/dashboard-icons/total-sessions.png"
              alt="Total Sessions"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          ),
        },
        {
          label: t('admin.totalUsers'),
          value: formatNumber(stats.total_users),
          icon: (
            <Image
              src="/assets/dashboard-icons/total-users.png"
              alt="Total Users"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          ),
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Failed to load statistics</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchStats()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {lastUpdated && (
            <>
              <span>Last updated: {formatLastUpdated()}</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Auto-refreshing"></span>
            </>
          )}
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
