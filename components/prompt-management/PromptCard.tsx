'use client';

import { X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PromptStatus } from '@/lib/admin-api';

interface PromptCardProps {
  promptId: string;
  icon: ReactNode;
  title: string;
  description: string;
  content: string;
  status: PromptStatus;
  lastUpdated: string;
  onSave: (promptId: string, content: string, status?: PromptStatus) => Promise<void>;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}

export default function PromptCard({
  promptId,
  icon,
  title,
  description,
  content,
  status,
  lastUpdated,
  onSave,
  isEditing,
  onEdit,
  onCancelEdit,
}: PromptCardProps) {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const [editedContent, setEditedContent] = useState(content);
  const [saving, setSaving] = useState(false);

  const statusConfig: Record<
    PromptStatus,
    { bg: string; text: string; label: string }
  > = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: t('pm.status.active'),
    },
    draft: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: t('pm.status.draft'),
    },
  };

  const statusStyle = statusConfig[status];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(promptId, editedContent);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    setEditedContent(content);
    onEdit();
  };

  const handleCancelClick = () => {
    setEditedContent(content);
    onCancelEdit();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header with icon, title, description, and action buttons */}
      <div
        className={`mb-4 flex items-start justify-between ${
          isArabic ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`flex flex-1 items-start gap-3 ${
            isArabic ? 'flex-row-reverse' : ''
          }`}
        >
          <div className="h-8 w-8 flex-shrink-0 text-gray-400">{icon}</div>
          <div className={`flex-1 ${isArabic ? 'text-right' : ''}`}>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
        </div>

        <div
          className={`ml-4 flex items-center gap-2 ${
            isArabic ? 'ml-0 mr-4 flex-row-reverse' : ''
          }`}
        >
          <button
            onClick={() => {
              if (!isEditing) {
                // Show full content in a modal or expand view
                const fullContent = content;
                alert(`Full prompt content (${content.length} characters)\n\n${fullContent.substring(0, 500)}...`);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <Image
              src="/assets/user-management-eye.svg"
              alt="Preview"
              width={16}
              height={16}
              className="h-4 w-4"
            />
            {t('pm.buttons.preview')}
          </button>
          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm text-white transition hover:bg-gray-900"
            >
              <Image
                src="/assets/edit.svg"
                alt="Edit"
                width={16}
                height={16}
                className="h-4 w-4"
              />
              {t('pm.buttons.edit')}
            </button>
          ) : (
            <button
              onClick={handleCancelClick}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Prompt text area - always visible */}
      <div className="mb-4">
            <textarea
          value={isEditing ? editedContent : content}
          onChange={(e) => isEditing && setEditedContent(e.target.value)}
          readOnly={!isEditing}
          rows={12}
          className={`w-full rounded border ${
            isEditing 
              ? 'border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500' 
              : 'border-gray-200 bg-gray-50'
          } px-4 py-3 text-sm text-gray-900 font-mono whitespace-pre-wrap resize-none`}
          placeholder="Prompt content will appear here..."
          style={{ minHeight: '200px' }}
        />
        </div>

      {/* Footer with status and save button */}
      <div
        className={`flex items-center justify-between ${
          isArabic ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`flex items-center gap-4 text-xs ${
            isArabic ? 'flex-row-reverse' : ''
          }`}
        >
          <span className="text-gray-600">
            Last updated: {lastUpdated}
          </span>
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
        </div>

        {isEditing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:opacity-50 ${
              isArabic ? 'flex-row-reverse' : ''
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image
                src="/assets/save.svg"
                alt="Save"
                width={16}
                height={16}
                className="h-4 w-4"
              />
            )}
            {t('pm.buttons.saveChanges')}
          </button>
        )}
      </div>
    </div>
  );
}
