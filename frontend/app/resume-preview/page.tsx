'use client';

import React, { useState, useEffect } from 'react';
import { Download, Loader2, FileText, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ResumePreviewHeader from '@/components/resume/ResumePreviewHeader';
import { TemplateSelector, Template } from '@/components/resume/TemplateSelector';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { getResumePreview, getDownloadUrl, PreviewResponse } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export default function ResumePreviewPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('classic');

  // Debug: Log template changes
  useEffect(() => {
    console.log('[ResumePreviewPage] Template changed to:', selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    const resumeId = sessionStorage.getItem('resumeId');

    if (!resumeId) {
      router.push('/');
      return;
    }

    const fetchPreview = async () => {
      try {
        const data = await getResumePreview(parseInt(resumeId));
        console.log('Fetched preview data:', data);
        console.log('Optimized text length:', data?.optimized_text?.length || 0);
        console.log('Optimized text preview:', data?.optimized_text?.substring(0, 200) || 'No text');
        setPreviewData(data);
      } catch (err) {
        console.error('Error fetching preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [router]);

  const handleDownload = async (format: 'txt' | 'pdf' | 'docx' = 'txt') => {
    const resumeId = sessionStorage.getItem('resumeId');
    if (!resumeId) return;

    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Please sign in to download your resume');
        return;
      }

      // Create download URL with auth token
      const downloadUrl = getDownloadUrl(parseInt(resumeId));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      link.target = '_blank';
      
      // Add auth header via fetch and create blob
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download resume. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
          <p className="text-gray-600">Loading optimized resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResumePreviewHeader />

      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex justify-end items-center gap-4">
          <LanguageSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-black hover:bg-gray-800">
                <Download className="h-4 w-4" />
                {t('resumePreview.download')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('pdf')} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('txt')} className="cursor-pointer">
                <FileDown className="w-4 h-4 mr-2" />
                Download as TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr]">
          <aside className="space-y-6">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateChange={(template) => {
                console.log('[ResumePreviewPage] Template selector clicked:', template);
                setSelectedTemplate(template);
              }}
            />
          </aside>

          <section>
            <ResumePreview
              key={selectedTemplate}
              optimizedText={previewData?.optimized_text}
              template={selectedTemplate}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
