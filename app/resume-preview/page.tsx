'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ResumePreviewHeader from '@/components/resume/ResumePreviewHeader';
import { TemplateSelector, Template } from '@/components/resume/TemplateSelector';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { getResumePreview, PreviewResponse } from '@/lib/api';
import { downloadResumeAsWord } from '@/lib/downloadResume';
import { generateAndDownloadPDF } from '@/lib/generatePDF';
import { ResumeData } from '@/lib/resumeDataTypes';

export default function ResumePreviewPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('classic');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const templateRef = useRef<HTMLDivElement | null>(null);

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

  // Handle resume data ready callback
  const handleResumeDataReady = (data: ResumeData | null, ref: React.RefObject<HTMLDivElement>) => {
    console.log('[ResumePreviewPage] handleResumeDataReady called', { 
      hasData: !!data, 
      hasRef: !!ref, 
      refCurrent: !!ref?.current,
      dataName: data?.name 
    });
    setResumeData(data);
    if (ref && ref.current) {
      // Use a mutable ref to store the element
      (templateRef as React.MutableRefObject<HTMLDivElement | null>).current = ref.current;
      console.log('[ResumePreviewPage] templateRef set successfully');
    } else {
      console.warn('[ResumePreviewPage] Ref not available in callback');
    }
  };

  // Download as PDF (using text-based PDF generation)
  const handleDownloadPDF = async () => {
    try {
      console.log('[Download] PDF button clicked');
      console.log('[Download] resumeData:', resumeData);
      
      if (!resumeData) {
        console.error('[Download] resumeData is null');
        alert('Resume data not available. Please wait a moment and try again.');
        return false;
      }

      const name = resumeData.name || 'resume';
      const filename = `${name.replace(/\s+/g, '_')}_${selectedTemplate}.pdf`;
      
      console.log('[Download] Starting text-based PDF generation, filename:', filename);
      
      // Use the new text-based PDF generation (selectable, searchable text)
      await generateAndDownloadPDF(resumeData, selectedTemplate, filename, language);
      
      console.log('[Download] PDF download completed');
      return false; // Prevent any default behavior
    } catch (error) {
      console.error('[Download] Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false; // Prevent any default behavior even on error
    }
  };

  // Download as Word
  const handleDownloadWord = async () => {
    try {
      console.log('[Download] Word button clicked');
      console.log('[Download] resumeData:', resumeData);
      
      if (!resumeData) {
        console.error('[Download] resumeData is null');
        alert('Resume data not available. Please wait a moment and try again.');
        return false; // Return false to prevent any default behavior
      }

      const name = resumeData.name || 'resume';
      const filename = `${name.replace(/\s+/g, '_')}_${selectedTemplate}.docx`;
      
      console.log('[Download] Starting Word generation, filename:', filename);
      
      await downloadResumeAsWord(resumeData, selectedTemplate, filename);
      
      console.log('[Download] Word download completed');
      return false; // Prevent any default behavior
    } catch (error) {
      console.error('[Download] Error downloading Word:', error);
      alert(`Failed to download Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false; // Prevent any default behavior even on error
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
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={async (e) => {
                console.log('[Download] PDF button clicked - START');
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                console.log('[Download] PDF button clicked - after preventDefault');
                
                try {
                  console.log('[Download] PDF handler executing');
                  await handleDownloadPDF();
                  console.log('[Download] PDF handler completed');
                } catch (err) {
                  console.error('[Download] Error in PDF handler:', err);
                  e.preventDefault();
                  e.stopPropagation();
                }
                
                return false;
              }}
              onMouseDown={(e) => {
                console.log('[Download] PDF button mousedown');
                e.preventDefault();
                e.stopPropagation();
              }}
              className="gap-2 bg-black hover:bg-gray-800"
            >
              <FileDown className="h-4 w-4" />
              Download as PDF
            </Button>
            <Button
              type="button"
              onClick={async (e) => {
                console.log('[Download] Word button clicked - START');
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                console.log('[Download] Word button clicked - after preventDefault');
                
                try {
                  console.log('[Download] Word handler executing');
                  await handleDownloadWord();
                  console.log('[Download] Word handler completed');
                } catch (err) {
                  console.error('[Download] Error in Word handler:', err);
                  e.preventDefault();
                  e.stopPropagation();
                }
                
                return false;
              }}
              onMouseDown={(e) => {
                console.log('[Download] Word button mousedown');
                e.preventDefault();
                e.stopPropagation();
              }}
              className="gap-2 bg-black hover:bg-gray-800"
            >
              <FileDown className="h-4 w-4" />
              Download as Word
            </Button>
          </div>
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
              optimizedText={previewData?.structured_data ? (previewData as any) : (previewData?.optimized_text || '')}
              template={selectedTemplate}
              onResumeDataReady={handleResumeDataReady}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
