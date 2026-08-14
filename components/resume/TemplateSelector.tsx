'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, Sparkles, Crown, Code, Check, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export type Template = 'classic' | 'modern' | 'executive' | 'technical';

interface TemplateSelectorProps {
  selectedTemplate: Template;
  onTemplateChange: (template: Template) => void;
}

const templateIcons = {
  classic: FileText,
  modern: Sparkles,
  executive: Crown,
  technical: Code,
};

const templateColors = {
  classic: 'bg-blue-50 text-blue-600',
  modern: 'bg-purple-50 text-purple-600',
  executive: 'bg-amber-50 text-amber-600',
  technical: 'bg-green-50 text-green-600',
};

export function TemplateSelector({ selectedTemplate, onTemplateChange }: TemplateSelectorProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const templates: Template[] = ['classic', 'modern', 'executive', 'technical'];

  const templateTags: Record<Template, string[]> = {
    classic: [t('templateSelector.classic.tag1'), t('templateSelector.classic.tag2')],
    modern: [t('templateSelector.modern.tag1'), t('templateSelector.modern.tag2')],
    executive: [t('templateSelector.executive.tag1'), t('templateSelector.executive.tag2')],
    technical: [t('templateSelector.technical.tag1'), t('templateSelector.technical.tag2')],
  };

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-lg font-normal">{t('templateSelector.title')}</h2>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <Image
            src="/assets/cv_template.svg"
            alt="CV Template"
            width={16}
            height={16}
            className="h-4 w-4"
          />
        </div>
      </div>

      <div className="space-y-3">
        {templates.map((template) => {
          const Icon = templateIcons[template];
          const isSelected = selectedTemplate === template;

          return (
            <Card
              key={template}
              className={`cursor-pointer p-4 transition-all ${
                isSelected ? 'border-2 border-black shadow-md' : 'border hover:border-gray-300'
              }`}
              onClick={() => onTemplateChange(template)}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${templateColors[template]}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{t(`templateSelector.${template}.name`)}</h3>
                      <p className="text-sm text-gray-500">{t(`templateSelector.${template}.description`)}</p>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    {templateTags[template].map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-black bg-gray-50 p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t('optimization.title')}</h3>

            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{t('optimization.atsOptimized')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{t('optimization.keywordsEnhanced')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{t('optimization.formattingImproved')}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

