'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { getResumes, AdminResumeListItem, ResumeStatus } from '@/lib/admin-api';

const REFRESH_INTERVAL = 30000; // 30 seconds auto-refresh

export default function ResumesDashboardTable() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isRTL = language === 'ar';

  const [resumes, setResumes] = useState<AdminResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ResumeStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResumes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await getResumes({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortBy,
      });
      setResumes(response.resumes);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    fetchResumes();

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchResumes(true);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchResumes]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchResumes();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const getStatusColor = (status: ResumeStatus) => {
    switch (status) {
      case 'optimized':
        return 'bg-green-100 text-green-700';
      case 'analyzed':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: ResumeStatus) => {
    switch (status) {
      case 'optimized':
        return t('admin.dashboard.status.optimized');
      case 'analyzed':
        return t('admin.dashboard.status.analyzed');
      case 'failed':
        return t('admin.dashboard.status.failed');
      case 'processing':
        return 'Processing';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    if (isRTL) {
      // Arabic format: "6 ديسمبر 2024" and "14:32 م"
      return {
        date: format(d, 'd MMMM yyyy', { locale: ar }),
        time: format(d, 'HH:mm', { locale: ar }) + (d.getHours() >= 12 ? ' م' : ' ص'),
      };
    } else {
      return {
        date: format(d, 'MMM d, yyyy'),
        time: format(d, 'HH:mm a'),
      };
    }
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);
  const showingText = total > 0
    ? `${t('admin.dashboard.showing')} ${startItem}-${endItem} ${t('admin.dashboard.of')} ${total} ${t('admin.dashboard.resumesCountLabel')}`
    : `${t('admin.dashboard.showing')} 0 ${t('admin.dashboard.resumesCountLabel')}`;

  const renderPagination = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Failed to load resumes</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchResumes()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`mb-6 flex items-center gap-4 ${
          isRTL ? 'flex-row-reverse' : ''
        }`}
      >
        <div className={isRTL ? 'text-right' : ''}>
          <label className="mb-1.5 block text-xs text-gray-600">
            {t('admin.dashboard.filters.status')}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | ResumeStatus);
              setCurrentPage(1);
            }}
            className="w-[140px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('admin.dashboard.filters.all')}</option>
            <option value="optimized">
              {t('admin.dashboard.status.optimized')}
            </option>
            <option value="analyzed">
              {t('admin.dashboard.status.analyzed')}
            </option>
            <option value="failed">{t('admin.dashboard.status.failed')}</option>
          </select>
        </div>

        <div className={isRTL ? 'text-right' : ''}>
          <label className="mb-1.5 block text-xs text-gray-600">
            {t('admin.dashboard.filters.sortBy')}
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'newest' | 'oldest');
              setCurrentPage(1);
            }}
            className="w-[140px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">{t('admin.dashboard.filters.newest')}</option>
            <option value="oldest">{t('admin.dashboard.filters.oldest')}</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="invisible mb-1.5 block text-xs text-gray-600">
            Search
          </label>
          <div className="relative">
            <Search
              size={16}
              className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${
                isRTL ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              placeholder={t('admin.dashboard.filters.searchPlaceholder')}
              className={`w-full rounded-md border border-gray-300 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 self-end pb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {lastUpdated && (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Auto-refreshing"></span>
              </>
            )}
            <span>{showingText}</span>
          </div>
          <button
            onClick={() => fetchResumes(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading resumes...</span>
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No resumes found
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => {
            const { date, time } = formatDateTime(resume.created_at);
            return (
              <div
                key={resume.id}
                className={`flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-black">
                  <FileText size={20} className="text-white" />
                </div>

                <div
                  className={`grid flex-1 grid-cols-1 gap-4 md:grid-cols-4 ${
                    isRTL ? 'text-right' : ''
                  }`}
                >
                  <div>
                    <div className="mb-0.5 text-xs text-gray-500">
                      {t('admin.dashboard.columns.requestNumber')}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {resume.request_number}
                    </div>
                  </div>

                  <div>
                    <div className={`mb-0.5 text-xs text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.dashboard.columns.user')}
                    </div>
                    <div className={`text-sm font-medium text-gray-900 ${isRTL ? 'text-right' : ''}`}>
                      {resume.user_name || 'Unknown'}
                    </div>
                    <div className={`text-xs text-gray-500 ${isRTL ? 'text-right' : ''}`}>{resume.user_email || '-'}</div>
                  </div>

                  <div>
                    <div className={`mb-0.5 text-xs text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                      {isRTL ? 'التاريخ والوقت' : t('admin.dashboard.columns.dateTime')}
                    </div>
                    <div className={`text-sm font-medium text-gray-900 ${isRTL ? 'text-right' : ''}`}>{date}</div>
                    <div className={`text-xs text-gray-500 ${isRTL ? 'text-right' : ''}`}>{time}</div>
                  </div>

                  <div
                    className={`flex items-center gap-3 ${
                      isRTL ? 'flex-row-reverse justify-end' : 'justify-end'
                    }`}
                  >
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                        resume.status
                      )}`}
                    >
                      {getStatusLabel(resume.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/resumes/${resume.id}`)}
                      className={`flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 ${
                        isRTL ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Image
                        src="/assets/user-management-eye.svg"
                        alt="View"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      <span>{t('admin.dashboard.view')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div
          className={`mt-6 flex items-center justify-between ${
            isRTL ? 'flex-row-reverse' : ''
          }`}
        >
          <button
            type="button"
            className={`flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
            <span>{t('admin.dashboard.pagination.previous')}</span>
          </button>

          <div className="flex items-center gap-1">
            {renderPagination().map((page, index) => (
              typeof page === 'number' ? (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-md text-sm ${
                    page === currentPage
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  disabled={loading}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="text-gray-500 text-sm">...</span>
              )
            ))}
          </div>

          <button
            type="button"
            className={`flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <span>{t('admin.dashboard.pagination.next')}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
