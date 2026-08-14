'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ResumePreviewHeader from '@/components/resume/ResumePreviewHeader';
import ProcessingAnimation from '@/components/processing/ProcessingAnimation';
import ProgressBar from '@/components/processing/ProgressBar';
import ProTip from '@/components/processing/ProTip';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { getResumeStatus, StatusResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function ProcessingContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'optimization';

  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const targetProgressRef = useRef(0);
  const animationFrameRef = useRef<number>();

  // Smooth progress animation
  useEffect(() => {
    const animateProgress = () => {
      setDisplayProgress(prev => {
        const target = targetProgressRef.current;
        const diff = target - prev;

        if (Math.abs(diff) < 0.5) {
          return target;
        }

        // Smooth easing - move faster when further from target
        const step = diff * 0.08;
        return prev + step;
      });

      animationFrameRef.current = requestAnimationFrame(animateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update target progress when actual progress changes
  useEffect(() => {
    targetProgressRef.current = progress;
  }, [progress]);

  const getBaseProgress = useCallback((status: StatusResponse, isAnalysis: boolean): number => {
    if (isAnalysis) {
      // Analysis mode milestones
      if (status.questions_available) return 100;
      if (status.analysis_complete) return 75;
      if (status.extracted_text_length && status.extracted_text_length > 0) return 35;
      return 5;
    } else {
      // Optimization mode milestones
      if (status.optimization_complete) return 100;
      if (status.answers_submitted) return 40;
      return 5;
    }
  }, []);

  useEffect(() => {
    const resumeId = sessionStorage.getItem('resumeId');

    if (!resumeId) {
      router.push('/');
      return;
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    let lastMilestone = 0;

    const pollStatus = async () => {
      try {
        const status = await getResumeStatus(parseInt(resumeId));

        if (!isMounted) return;

        // Get base progress from status milestones
        const isAnalysis = mode === 'analysis';
        const baseProgress = getBaseProgress(status, isAnalysis);

        // Update milestone if we've reached a new one
        if (baseProgress > lastMilestone) {
          lastMilestone = baseProgress;
          setProgress(baseProgress);
        }

        // Check completion based on mode
        if (isAnalysis) {
          if (status.questions_available) {
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => {
              if (isMounted) {
                router.push('/questions');
              }
            }, 800);
            return;
          }
        } else {
          if (status.optimization_complete) {
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => {
              if (isMounted) {
                router.push('/resume-preview');
              }
            }, 800);
            return;
          }
        }

        // Check for failure
        if (status.status === 'FAILED') {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          setError(status.error_message || 'Processing failed');
          return;
        }

      } catch (err) {
        console.error('Status polling error:', err);
      }
    };

    // Gradual progress increment between milestones
    const incrementProgress = () => {
      setProgress(prev => {
        // Define milestone boundaries based on mode
        const milestones = mode === 'analysis'
          ? [5, 35, 75, 100]
          : [5, 40, 100];

        // Find current milestone range
        let nextMilestone = 100;
        for (const m of milestones) {
          if (m > prev) {
            nextMilestone = m;
            break;
          }
        }

        // Don't exceed the next milestone - leave room for actual status update
        const maxProgress = nextMilestone - 3;
        if (prev >= maxProgress) return prev;

        // Small random increment for natural feel
        const increment = 0.3 + Math.random() * 0.5;
        return Math.min(prev + increment, maxProgress);
      });
    };

    // Initial poll
    pollStatus();

    // Poll status every 2 seconds
    pollInterval = setInterval(pollStatus, 2000);

    // Increment progress smoothly every 500ms
    progressInterval = setInterval(incrementProgress, 500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, [router, mode, getBaseProgress]);

  return (
    <div className="h-screen bg-[#F5F5F7] overflow-hidden flex flex-col">
      <ResumePreviewHeader />
      <div className="flex justify-end px-6 py-2">
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <p className="text-[#1D1D1F] text-base font-normal">
                {t('processingStatusLabel')}
              </p>
            </div>

            <ProcessingAnimation />

            <div className="w-full space-y-4">
              <ProgressBar progress={Math.round(displayProgress)} label={t('processingLabel')} />

              <div className="text-center space-y-2">
                <h1 className="text-[#1D1D1F] text-2xl font-semibold leading-tight">
                  {t('processingTitle')}
                </h1>
                <p className="text-[#6E6E73] text-sm leading-relaxed max-w-2xl mx-auto">
                  {t('processingDescription')}
                </p>
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
              </div>

              <div className="flex justify-center pt-1">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-black rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-black rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
              </div>
            </div>

            <ProTip />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingFallback() {
  return (
    <div className="h-screen bg-[#F5F5F7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<ProcessingFallback />}>
      <ProcessingContent />
    </Suspense>
  );
}
