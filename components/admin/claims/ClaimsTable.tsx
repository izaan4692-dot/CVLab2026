'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Download, Filter, ChevronLeft, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import { getClaims, updateClaimStatus, exportClaims, AdminClaim, ClaimStatus } from '@/lib/admin-api';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const AVATAR_COLORS = [
  'from-amber-400 to-orange-500',
  'from-blue-400 to-blue-600',
  'from-pink-400 to-rose-500',
  'from-teal-400 to-cyan-500',
  'from-purple-400 to-violet-500',
  'from-green-400 to-emerald-500',
];

function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

type StatusFilterType = 'all' | ClaimStatus;

export default function ClaimsTable() {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const pageSize = 10;

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getClaims({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setClaims(response.claims);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchClaims();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleStatusChange = async (claimId: number, newStatus: ClaimStatus) => {
    try {
      await updateClaimStatus(claimId, newStatus);
      fetchClaims();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
    setOpenDropdown(null);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportClaims();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claims_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const formatSubmitted = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: isArabic ? ar : undefined
      });
    } catch {
      return isArabic ? 'غير معروف' : 'Unknown';
    }
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-blue-100 text-blue-700';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      case 'OPEN':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: ClaimStatus) => {
    switch (status) {
      case 'PENDING':
        return t('claims.statusPending');
      case 'IN_REVIEW':
        return t('claims.statusInReview');
      case 'RESOLVED':
        return t('claims.statusResolved');
      case 'OPEN':
        return t('claims.statusOpen');
      default:
        return status;
    }
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

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
        <p className="font-medium">Failed to load claims</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchClaims}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 space-y-4">
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={isArabic ? 'text-right' : ''}>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('claims.allClaims')}
            </h2>
          </div>
          <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleExport}
              disabled={exporting}
              className={`flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${isArabic ? 'flex-row-reverse' : ''}`}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{t('claims.export')}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1 relative">
              <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="text"
                placeholder={t('claims.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                dir={isArabic ? 'rtl' : 'ltr'}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilterType);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isArabic ? 'font-bold' : ''}`}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('claims.filterAllStatus')}</option>
              <option value="PENDING">{t('claims.statusPending')}</option>
              <option value="OPEN">{t('claims.statusOpen')}</option>
              <option value="IN_REVIEW">{t('claims.statusInReview')}</option>
              <option value="RESOLVED">{t('claims.statusResolved')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto" dir={isArabic ? 'rtl' : 'ltr'}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className={`px-6 py-3 ${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-900 uppercase tracking-wider`}>
                {t('claims.claimId')}
              </th>
              <th className={`px-6 py-3 ${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-900 uppercase tracking-wider`}>
                {t('claims.user')}
              </th>
              <th className={`px-6 py-3 ${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-900 uppercase tracking-wider`}>
                {t('claims.subject')}
              </th>
              <th className={`px-6 py-3 ${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-900 uppercase tracking-wider`}>
                {t('claims.status')}
              </th>
              <th className={`px-6 py-3 ${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-900 uppercase tracking-wider`}>
                {t('claims.submitted')}
              </th>
              <th className={`px-6 py-3 ${isArabic ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-900 uppercase tracking-wider`}>
                {t('claims.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Loading claims...</p>
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No claims found
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                  <td className={`px-6 py-4 text-sm font-medium text-gray-900 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {claim.claim_id}
                  </td>
                  <td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(claim.user_id)} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-white font-semibold text-xs">
                          {getInitials(claim.user_name, claim.user_email)}
                        </span>
                      </div>
                      <div className={`${isArabic ? 'text-right flex-1' : 'flex-1'}`}>
                        <p className={`text-sm font-medium text-gray-900 ${isArabic ? 'text-right' : ''}`}>
                          {claim.user_name || 'Unknown'}
                        </p>
                        <p className={`text-xs text-gray-500 ${isArabic ? 'text-right' : ''}`}>{claim.user_email || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <div className={isArabic ? 'text-right' : ''}>
                      <p className={`text-sm font-medium text-gray-900 ${isArabic ? 'text-right' : ''}`}>
                        {claim.subject}
                      </p>
                      <p className={`text-xs text-gray-500 line-clamp-1 ${isArabic ? 'text-right' : ''}`}>
                        {claim.description}
                      </p>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <span
                      className={`inline-flex items-center justify-center px-5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(claim.status)}`}
                    >
                      {getStatusLabel(claim.status)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm text-gray-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {formatSubmitted(claim.created_at)}
                  </td>
                  <td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === claim.id ? null : claim.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        {t('claims.update')}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {openDropdown === claim.id && (
                        <div className={`absolute ${isArabic ? 'left-0' : 'right-0'} mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10`}>
                          <button
                            onClick={() => handleStatusChange(claim.id, 'PENDING')}
                            className={`w-full px-4 py-2 text-sm hover:bg-gray-50 ${isArabic ? 'text-right' : 'text-left'}`}
                          >
                            {t('claims.statusPending')}
                          </button>
                          <button
                            onClick={() => handleStatusChange(claim.id, 'OPEN')}
                            className={`w-full px-4 py-2 text-sm hover:bg-gray-50 ${isArabic ? 'text-right' : 'text-left'}`}
                          >
                            {t('claims.statusOpen')}
                          </button>
                          <button
                            onClick={() => handleStatusChange(claim.id, 'IN_REVIEW')}
                            className={`w-full px-4 py-2 text-sm hover:bg-gray-50 ${isArabic ? 'text-right' : 'text-left'}`}
                          >
                            {t('claims.statusInReview')}
                          </button>
                          <button
                            onClick={() => handleStatusChange(claim.id, 'RESOLVED')}
                            className={`w-full px-4 py-2 text-sm hover:bg-gray-50 ${isArabic ? 'text-right' : 'text-left'}`}
                          >
                            {t('claims.statusResolved')}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {t('claims.showingOf')} {startItem} - {endItem} {t('claims.of')} {total} {t('claims.claims')}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {renderPagination().map((page, idx) => (
            typeof page === 'number' ? (
              <button
                key={idx}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${
                  page === currentPage
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                disabled={loading}
              >
                {page}
              </button>
            ) : (
              <span key={idx} className="text-gray-500 text-sm">...</span>
            )
          ))}

          <button
            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
