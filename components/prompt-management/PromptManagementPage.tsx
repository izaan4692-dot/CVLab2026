'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from './Header';
import LLMConfiguration from './LLMConfiguration';
import PromptCard from './PromptCard';
import { getPrompts, updatePrompt, Prompt, PromptStatus } from '@/lib/admin-api';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// Map backend prompt IDs to custom icon paths
const PROMPT_ICON_PATHS: Record<string, string> = {
  analyze_resume: '/assets/analyse_resume.svg',
  generate_questions: '/assets/question_generation.svg',
  optimize_resume: '/assets/optimise_resume.svg',
  // Legacy IDs for backward compatibility
  prompt1_analyst: '/assets/analyse_resume.svg',
  prompt2_gatherer: '/assets/question_generation.svg',
  prompt3_craftsman: '/assets/optimise_resume.svg',
};

// Map prompt IDs to display names - matching screenshot design
const PROMPT_DISPLAY_NAMES: Record<string, { title: string; description: string }> = {
  analyze_resume: {
    title: 'Analyze Resume Prompt',
    description: 'Template for comprehensive resume analysis',
  },
  generate_questions: {
    title: 'Question Generation Prompt',
    description: 'Template for generating interview questions based on resume',
  },
  optimize_resume: {
    title: 'Optimize Resume Prompt',
    description: 'Template for resume optimization suggestions',
  },
};

export default function PromptManagementPage() {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await getPrompts();
      setPrompts(response.prompts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (promptId: string, content: string, status?: PromptStatus) => {
    try {
      await updatePrompt(promptId, content, status);
      await fetchPrompts();
      setEditingPrompt(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save prompt');
    }
  };

  const formatLastUpdated = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getPromptIcon = (promptId: string): React.ReactNode => {
    const iconPath = PROMPT_ICON_PATHS[promptId] || '/assets/analyse_resume.svg';
    return (
      <Image
        src={iconPath}
        alt={promptId}
        width={24}
        height={24}
        className="h-6 w-6"
      />
    );
  };

  // Sort prompts to show in order: analyze_resume, generate_questions, optimize_resume
  const sortedPrompts = [...prompts].sort((a, b) => {
    const order: Record<string, number> = {
      analyze_resume: 1,
      generate_questions: 2,
      optimize_resume: 3,
    };
    return (order[a.id] || 999) - (order[b.id] || 999);
  });

  return (
    <div className="min-h-screen bg-gray-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className={`mb-12 ${isArabic ? 'text-right' : ''}`}>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('pm.page.title')}
          </h1>
          <p className="mt-2 text-base text-gray-600">{t('pm.page.subtitle')}</p>
        </div>

        <div className="space-y-8">
          <LLMConfiguration />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading prompts...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Failed to load prompts</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchPrompts}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No prompts configured
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPrompts.map((prompt) => {
                const displayInfo = PROMPT_DISPLAY_NAMES[prompt.id] || {
                  title: prompt.title,
                  description: prompt.description,
                };
                return (
                  <PromptCard
                    key={prompt.id}
                    promptId={prompt.id}
                    icon={getPromptIcon(prompt.id)}
                    title={displayInfo.title}
                    description={displayInfo.description}
                    content={prompt.content}
                    status={prompt.status}
                    lastUpdated={formatLastUpdated(prompt.last_updated)}
                    onSave={handleSavePrompt}
                    isEditing={editingPrompt?.id === prompt.id}
                    onEdit={() => setEditingPrompt(prompt)}
                    onCancelEdit={() => setEditingPrompt(null)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
