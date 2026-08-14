'use client';

import { Brain, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLLMConfig, updateLLMConfig, LLMProvider, LLMConfig } from '@/lib/admin-api';

// Latest production models as of December 2025
const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  anthropic: [
    'claude-sonnet-4-5-20250929',      // Latest Claude Sonnet 4.5 (Sept 2025) - Best performance
    'claude-opus-4-5-20251101',        // Latest Claude Opus 4.5 (Nov 2025) - Most capable
    'claude-haiku-4-5-20251001',       // Latest Claude Haiku 4.5 (Oct 2025) - Fastest
    'claude-3-5-sonnet-20241022',      // Claude 3.5 Sonnet (Oct 2024)
    'claude-3-opus-20240229',          // Claude 3 Opus (Feb 2024)
    'claude-3-sonnet-20240229',        // Claude 3 Sonnet (Feb 2024)
    'claude-3-haiku-20240307',         // Claude 3 Haiku (Mar 2024)
  ],
  openai: [
    'gpt-4o',                          // Latest GPT-4o (Omni) - Best performance, multimodal
    'gpt-4o-mini',                     // GPT-4o Mini - Cost-effective, fast
    'gpt-4-turbo',                     // GPT-4 Turbo - Enhanced performance
    'gpt-4',                           // GPT-4 Standard
    'gpt-3.5-turbo',                   // GPT-3.5 Turbo - Fastest/Cheapest
  ],
};

export default function LLMConfiguration() {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [model, setModel] = useState('');

  const providers: LLMProvider[] = ['anthropic', 'openai'];

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const data = await getLLMConfig();
        setConfig(data);
        setProvider(data.provider);
        setModel(data.model);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load config');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  useEffect(() => {
    // When provider changes, set the first available model for that provider
    const availableModels = PROVIDER_MODELS[provider] || [];
    if (availableModels.length > 0 && !availableModels.includes(model)) {
      setModel(availableModels[0]);
    }
  }, [provider]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      await updateLLMConfig(provider, model);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const availableModels = PROVIDER_MODELS[provider] || [];

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className={`mb-6 flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
          <Brain className="h-5 w-5 text-gray-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          LLM Configuration
        </h2>
      </div>

      <div className={`mb-6 grid gap-4 sm:grid-cols-2 ${isArabic ? 'text-right' : ''}`}>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            LLM Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as LLMProvider)}
            className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:opacity-50 ${isArabic ? 'flex-row-reverse' : ''}`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="text-base">💾</span>
          )}
          Save Model Configuration
        </button>

        {success && (
          <span className="text-sm text-green-600">Configuration saved successfully!</span>
        )}
      </div>

      {config && (
        <p className="mt-4 text-xs text-gray-500">
          Max tokens: {config.max_tokens.toLocaleString()}
        </p>
      )}
    </div>
  );
}
