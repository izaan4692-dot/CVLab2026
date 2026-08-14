'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLLMConfig, updateLLMConfig, LLMConfig, LLMProvider } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [model, setModel] = useState('');
  const [maxTokens, setMaxTokens] = useState(8000);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getLLMConfig();
      setConfig(data);
      setProvider(data.provider);
      setModel(data.model);
      setMaxTokens(data.max_tokens);
    } catch (error) {
      console.error('Failed to fetch LLM config:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateLLMConfig(provider, model);
      setConfig(updated);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to update LLM config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const anthropicModels = [
    'claude-sonnet-4-5-20250929',
    'claude-opus-4-5-20251101',
    'claude-haiku-4-5-20251001',
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  const openaiModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ];

  const availableModels = provider === 'anthropic' ? anthropicModels : openaiModels;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            <CardTitle>LLM Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure the AI model provider and settings for resume optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => {
                const newProvider = e.target.value as LLMProvider;
                setProvider(newProvider);
                // Reset model when provider changes
                const models = newProvider === 'anthropic' ? anthropicModels : openaiModels;
                setModel(models[0]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {provider === 'anthropic'
                ? 'Claude models provide excellent resume analysis and optimization'
                : 'GPT models offer fast processing with good quality results'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8000)}
              min={1000}
              max={32000}
              step={1000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum tokens for AI responses (1000-32000)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !model}
              className="bg-black hover:bg-gray-800"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={fetchConfig}
              disabled={saving}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">{config.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{config.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Tokens:</span>
                <span className="font-medium">{config.max_tokens}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

