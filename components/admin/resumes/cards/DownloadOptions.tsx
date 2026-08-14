'use client';

import { Download, FileText, Wand2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getResumeDownloadUrl } from '@/lib/admin-api';
import { createClient } from '@/lib/supabase/client';

interface DownloadOptionsProps {
  resumeId: number;
}

export default function DownloadOptions({ resumeId }: DownloadOptionsProps) {
  const { t } = useLanguage();

  const handleDownload = async (type: 'original' | 'optimized') => {
    try {
      const downloadUrl = getResumeDownloadUrl(resumeId, type);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Fetch with authentication
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Download failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Check if response is JSON (S3 presigned URL) or file
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.download_url) {
          // Fetch the file from presigned URL and download it
          // This ensures the Content-Disposition header from S3 is respected
          try {
            const fileResponse = await fetch(data.download_url);
            if (!fileResponse.ok) {
              throw new Error('Failed to fetch file from S3');
            }
            
            const blob = await fileResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Determine filename based on type and original filename from Content-Disposition header
            const contentDisposition = fileResponse.headers.get('content-disposition');
            let filename = type === 'original' 
              ? `resume_${resumeId}_original.pdf` 
              : `resume_${resumeId}_optimized.pdf`;
            
            // Extract filename from Content-Disposition header if available
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
              if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
              }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (fetchError) {
            // If fetch fails, it might be a CORS issue or file doesn't exist
            console.error('Failed to fetch file from S3:', fetchError);
            // Try to download directly using the presigned URL
            // Create a link and trigger download
            const link = document.createElement('a');
            link.href = data.download_url;
            link.download = type === 'original' 
              ? `resume_${resumeId}_original.pdf` 
              : `resume_${resumeId}_optimized.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            // Clean up after a delay
            setTimeout(() => {
              document.body.removeChild(link);
            }, 100);
          }
          return;
        }
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'original' ? `resume_${resumeId}_original.pdf` : `resume_${resumeId}_optimized.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download resume. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDownloadOriginal = () => handleDownload('original');
  const handleDownloadOptimized = () => handleDownload('optimized');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="w-5 h-5" />
          {t('admin.downloadOptions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={handleDownloadOriginal}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">
                {t('admin.downloadOptions.downloadOriginal')}
              </div>
              <div className="text-sm text-gray-500">
                {t('admin.downloadOptions.originalUploaded')}
              </div>
            </div>
          </button>

          <Button 
            onClick={handleDownloadOptimized}
            className="flex items-center gap-3 px-6 py-6 bg-black hover:bg-gray-800 text-white h-auto"
          >
            <Wand2 className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">
                {t('admin.downloadOptions.downloadOptimized')}
              </div>
              <div className="text-sm opacity-80">
                {t('admin.downloadOptions.aiEnhanced')}
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


