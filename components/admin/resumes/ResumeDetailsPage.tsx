'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getResume, AdminResumeDetail } from '@/lib/admin-api';
import ResumeInformation from './cards/ResumeInformation';
import UserInformation from './cards/UserInformation';
import DownloadOptions from './cards/DownloadOptions';
import ExtractedTextPreview from './cards/ExtractedTextPreview';
import { Button } from '@/components/ui/button';
import AdminSectionHeader from './SectionHeader';

interface ResumeDetailsPageProps {
  resumeId?: number;
}

export default function ResumeDetailsPage({ resumeId: propResumeId }: ResumeDetailsPageProps) {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const [resume, setResume] = useState<AdminResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get resumeId from URL params first, then from props
  const resumeId = params?.id ? parseInt(params.id as string, 10) : (propResumeId || 1);

  useEffect(() => {
    async function fetchResume() {
      if (!resumeId || isNaN(resumeId)) {
        setError('Invalid resume ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getResume(resumeId);
        setResume(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume');
        console.error('Error fetching resume:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResume();
  }, [resumeId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
          <p className="text-gray-600">Loading resume details...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-600">{error || 'Resume not found'}</p>
          <Button onClick={() => router.push('/admin/resumes')} variant="outline">
            Back to Resumes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSectionHeader
        title={`${t('admin.resumeDetails.title')}: ${resume.original_filename}`}
        subtitle={t('admin.resumeDetails.subtitle')}
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/resumes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.resumeDetails.backToResumes')}
          </Button>
        </div>

        <div className="space-y-6">
          <ResumeInformation
            data={{
              id: resume.request_number,
              user: resume.user_name || 'N/A',
              originalFilename: resume.original_filename,
              created: formatDate(resume.created_at),
              fileSize: formatFileSize(resume.file_size),
              analyzed: resume.ai_optimization !== null,
            }}
          />

          <UserInformation
            data={{
              email: resume.user_email || 'N/A',
              requestNumber: resume.request_number,
              status: resume.user_status || 'inactive',
            }}
          />

          <DownloadOptions resumeId={resume.id} />

          <ExtractedTextPreview text={resume.extracted_text || ''} />
        </div>
      </div>
    </div>
  );
}


