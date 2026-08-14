'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Eye, Trash2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Edit, SquareArrowOutUpRight, Ban, CheckCircle } from 'lucide-react';
import { getUsers, deleteUser, updateUserStatus, AdminUser, UserStatus, UserRole } from '@/lib/admin-api';
import { formatDistanceToNow } from 'date-fns';

const REFRESH_INTERVAL = 120000; // 2 minutes auto-refresh

type StatusFilter = 'all' | 'active' | 'inactive';
type RoleFilter = 'all' | 'user' | 'admin' | 'authenticated';
type SortFilter = 'newest' | 'oldest';

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

export default function UserManagementTable({
  showTitle = true,
}: {
  showTitle?: boolean;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortFilter>('newest');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const pageSize = 20; // Increased from 10 to show more users per page
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await getUsers({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        role: selectedRole !== 'all' ? (selectedRole as UserRole) : undefined,
        sort: selectedSort,
      });
      setUsers(response.users);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchQuery, selectedStatus, selectedRole, selectedSort]);

  useEffect(() => {
    fetchUsers();

    // Auto-refresh every 2 minutes
    intervalRef.current = setInterval(() => {
      fetchUsers(true);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUsers]);

  // Reset page to 1 and refetch when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedRole, selectedSort]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      setDeleting(userId);
      await deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: UserStatus) => {
    const newStatus: UserStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`)) return;

    try {
      setUpdatingStatus(userId);
      await updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatLastActive = (lastActive: string | null): string => {
    if (!lastActive) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusColor = (status: UserStatus) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';
  };

  const getRoleColor = (role: UserRole) => {
    return role === 'admin'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';
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
        <p className="font-medium">Failed to load users</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchUsers()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        {showTitle && (
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t('admin.userManagement')}
          </h3>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as StatusFilter);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value as RoleFilter);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={selectedSort}
            onChange={(e) => {
              setSelectedSort(e.target.value as SortFilter);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="newest">Sort by Date</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {lastUpdated && (
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Auto-refreshing every 2 minutes • Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                {t('admin.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                {t('admin.role')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                {t('admin.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                {t('admin.lastActive')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Resumes
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user.id)} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-white font-semibold text-xs">
                          {getInitials(user.full_name, user.email)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                    >
                      {user.role === 'admin' ? t('admin.roleManager') : t('admin.roleUser')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
                    >
                      {user.status === 'active' ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatLastActive(user.last_active)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {user.resumes_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-gray-500 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors"
                        title="View user details"
                        onClick={() => router.push(`/profile?userId=${user.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 rounded transition-colors disabled:opacity-50 ${
                          user.status === 'active'
                            ? 'text-gray-500 hover:bg-yellow-100 hover:text-yellow-600'
                            : 'text-gray-500 hover:bg-green-100 hover:text-green-600'
                        }`}
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={updatingStatus === user.id}
                        title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                      >
                        {updatingStatus === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.status === 'active' ? (
                          <Ban className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting === user.id}
                        title="Delete user"
                      >
                        {deleting === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
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
          {t('admin.showing')} {startItem} - {endItem} {t('admin.of')} {total.toLocaleString()} {t('admin.userCount')}
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
