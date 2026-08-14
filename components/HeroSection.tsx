'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, FileText, UserPlus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// S3 Upload Response type
interface S3UploadResponse {
  success: boolean;
  fileUrl: string;
  presignedUrl: string;
  key: string;
  originalName: string;
  resumeId?: number;
}

export default function HeroSection() {
  const { t, language } = useLanguage();
  const { user, session } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Check if user is authenticated
    if (!user) {
      // Show signup modal instead of redirecting
      setShowSignUpModal(true);
      return;
    }

    // Validate file type
    const validTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      alert('Please upload a PDF or DOC file');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    await handleUpload(selectedFile);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Step 1: Upload to S3
      const formData = new FormData();
      formData.append('file', file);

      const s3Response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!s3Response.ok) {
        const error = await s3Response.json();
        throw new Error(error.error || 'S3 upload failed');
      }

      const s3Data: S3UploadResponse = await s3Response.json();

      // Step 2: Register with backend (send S3 URL)
      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.cvlab.sa/api/v1'}/upload-s3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          s3_key: s3Data.key,
          s3_url: s3Data.fileUrl,
          original_filename: s3Data.originalName,
          file_size: file.size,
          file_type: file.type,
        }),
      });

      if (!backendResponse.ok) {
        const error = await backendResponse.json();
        throw new Error(error.detail || 'Backend registration failed');
      }

      const backendData = await backendResponse.json();

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setShowSuccessModal(true);

      // Store resume info in sessionStorage
      sessionStorage.setItem('resumeId', backendData.id.toString());
      sessionStorage.setItem('resumeFilename', s3Data.originalName);
      sessionStorage.setItem('resumeFileSize', file.size.toString());
      sessionStorage.setItem('s3Key', s3Data.key);
      sessionStorage.setItem('s3Url', s3Data.fileUrl);
      if (user?.id) sessionStorage.setItem('userId', user.id);

      // Navigate to payment after 5 seconds
      setTimeout(() => {
        router.push('/payment');
      }, 5000);

    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      setFile(null);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      console.error('Upload error:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Check if user is authenticated before allowing upload
    if (!user) {
      setShowSignUpModal(true);
      return;
    }

    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleButtonClick = () => {
    // Check if user is authenticated before allowing upload
    if (!user) {
      setShowSignUpModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleSignUpRedirect = () => {
    sessionStorage.setItem('pendingUpload', 'true');
    setShowSignUpModal(false);
    router.push('/signup');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFileSelect(selectedFile);
  };

  return (
    <section className="relative pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl lg:text-[72px] text-gray-900 leading-tight">
            <span className="font-normal">{t('heroTitleLine1Part1')}</span>
            {t('heroTitleLine1Part2') && t('heroTitleLine1Part2') !== 'heroTitleLine1Part2' && (
              <>{' '}<span className="font-bold">{t('heroTitleLine1Part2')}</span></>
            )}
            <br />
            <span className="font-bold">{t('heroTitleLine2')}</span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-normal" style={{ color: '#475569' }}>
            {t('heroSubtitleLine1')}<br />
            {t('heroSubtitleLine2')}
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-transparent border-2 border-dashed rounded-xl py-3 px-4 space-y-2 transition-all flex flex-col items-center justify-center mx-auto w-full ${
            isDragging
              ? 'border-black bg-gray-50/50'
              : isUploading
              ? 'border-gray-400'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }`}
          style={{
            width: 'min(480px, 100%)',
            height: '220px',
            maxWidth: '100%'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!isUploading && !file && (
            <>
              <div className="flex justify-center">
                <Image
                  src="/assets/upload cloud button.png"
                  alt="Upload Cloud"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </div>

              <div className="space-y-1">
                <p className="text-base font-normal text-gray-900">{t('dropResume')}</p>
                <p className="text-xs text-gray-500">{t('supportedFormats')}</p>
              </div>

              <Button
                onClick={handleButtonClick}
                className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 h-auto rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Image
                  src="/assets/upload_resume.svg"
                  alt="Upload"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                {t('uploadResume')}
              </Button>

              {uploadError && (
                <p className="text-red-500 text-sm">{uploadError}</p>
              )}
            </>
          )}

          {isUploading && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <FileText className="w-12 h-12 text-black animate-pulse" />
              </div>

              <div className="space-y-3">
                <p className="text-lg font-medium text-gray-900">Uploading your resume...</p>
                <div className="max-w-md mx-auto space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {uploadError}
          </div>
        )}
      </div>

      {/* Sign Up Required Modal */}
      <Dialog open={showSignUpModal} onOpenChange={setShowSignUpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              {t('signUpRequired') || 'Sign Up Required'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('signUpToUpload') || 'Please create an account or sign in to upload your resume and use CVLab\'s AI-powered optimization.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowSignUpModal(false)}
              className="flex-1"
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSignUpRedirect}
              className="flex-1 bg-black hover:bg-gray-900 text-white"
            >
              {t('signUpNow') || 'Sign Up Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">File Uploaded!</h3>
              <p className="text-slate-600 text-center">
                Your resume has been uploaded successfully. Redirecting to payment...
              </p>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-black rounded-full animate-progress-bar" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
