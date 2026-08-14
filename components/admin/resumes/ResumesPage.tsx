'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { File, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getResumes, AdminResumeListItem, ResumeStatus, UserStatus } from '@/lib/admin-api';
import { format } from 'date-fns';
import AdminSectionHeader from './SectionHeader';

export default function ResumesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [resumes, setResumes] = useState<AdminResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResumes() {
      try {
        setLoading(true);
        setError(null);
        const response = await getResumes({
          page: 1,
          page_size: 100, // Get all resumes
          sort: 'newest',
        });
        setResumes(response.resumes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resumes');
        console.error('Error fetching resumes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResumes();
  }, []);

  const getUserStatusColor = (status: UserStatus | null) => {
    // Default to inactive if status is null or undefined
    if (status === 'active') {
      return 'bg-green-100 text-green-700';
    } else {
      // Treat null, undefined, or 'inactive' as inactive
      return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getUserStatusLabel = (status: UserStatus | null) => {
    // Default to inactive if status is null or undefined
    if (status === 'active') {
      return 'Active';
    } else {
      // Treat null, undefined, or 'inactive' as inactive
      return 'Inactive';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSectionHeader
          title={t('admin.resumes.pageTitle')}
          subtitle={t('admin.resumes.pageSubtitle')}
        />
        <div className="max-w-7xl mx-auto p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
            <p className="text-gray-600">Loading resumes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSectionHeader
          title={t('admin.resumes.pageTitle')}
          subtitle={t('admin.resumes.pageSubtitle')}
        />
        <div className="max-w-7xl mx-auto p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSectionHeader
        title={t('admin.resumes.pageTitle')}
        subtitle={t('admin.resumes.pageSubtitle')}
      />

      <div className="max-w-7xl mx-auto p-8">
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No resumes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <Card
                key={resume.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/admin/resumes/${resume.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <File className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {resume.original_filename}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {resume.user_name || 'N/A'} • {formatDate(resume.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getUserStatusColor(resume.user_status)}>
                      {getUserStatusLabel(resume.user_status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


