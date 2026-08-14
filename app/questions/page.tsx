'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import ResumePreviewHeader from '@/components/resume/ResumePreviewHeader';
import FileDisplay from '@/components/questions/FileDisplay';
import QuestionCard from '@/components/questions/QuestionCard';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { getQuestions, submitAnswers, QuestionItem, AnswerItem } from '@/lib/api';

export default function QuestionsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isRTL = language === 'ar';

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('Resume.pdf');
  const [fileSize, setFileSize] = useState('0 kB');

  useEffect(() => {
    const resumeId = sessionStorage.getItem('resumeId');
    const storedFilename = sessionStorage.getItem('resumeFilename');
    const storedFileSize = sessionStorage.getItem('resumeFileSize');

    if (storedFilename) setFileName(storedFilename);
    if (storedFileSize) {
      const sizeKB = Math.round(parseInt(storedFileSize) / 1024);
      setFileSize(`${sizeKB} kB`);
    }

    if (!resumeId) {
      router.push('/');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await getQuestions(parseInt(resumeId));
        setQuestions(response.questions);
        // Initialize answers object
        const initialAnswers: Record<number, string> = {};
        response.questions.forEach((q) => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [router]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateProgress = () => {
    if (questions.length === 0) return 0;
    const filledCount = Object.values(answers).filter((a) => a.trim() !== '').length;
    return Math.round((filledCount / questions.length) * 100);
  };

  const handleAnalyze = async () => {
    const resumeId = sessionStorage.getItem('resumeId');
    if (!resumeId) {
      router.push('/');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare answers for submission
      const answerItems: AnswerItem[] = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || '',
        status: answers[q.id]?.trim() ? 'complete' : 'skipped',
      }));

      await submitAnswers({
        resume_id: parseInt(resumeId),
        answers: answerItems,
      });

      // Navigate to processing page (optimization mode)
      router.push('/processing?mode=optimization');
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
      setSubmitting(false);
    }
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <ResumePreviewHeader />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{questions.length}</span>
            </div>
            <h1 className="text-lg font-medium text-gray-900">{t('questions')}</h1>
          </div>
          <LanguageSwitcher />
        </div>

        <FileDisplay
          fileName={fileName}
          fileSize={fileSize}
          pageCount={1}
          status={t('ready')}
          isRTL={isRTL}
        />

        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-normal text-gray-900 mb-3">
              {t('resumeOptimizationTitle')}
            </h2>
            <p className="text-gray-600 text-sm mb-8 max-w-2xl mx-auto">
              {t('resumeOptimizationSubtitle')}
            </p>
          </div>

          <div className="mb-8">
            <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm text-gray-600">{t('progress')}</span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                number={index + 1}
                title={question.question}
                placeholder={question.example || 'Type your answer here...'}
                value={answers[question.id] || ''}
                onChange={(value) => handleAnswerChange(question.id, value)}
                isRTL={isRTL}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center pb-8">
          <button
            onClick={handleAnalyze}
            disabled={submitting}
            className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Image
                src="/assets/analyze_optimize.svg"
                alt="Analyze"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            )}
            <span>{submitting ? 'Submitting...' : t('analyzeButton')}</span>
            {!submitting && (isRTL ? (
              <ArrowLeft className="w-5 h-5" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
