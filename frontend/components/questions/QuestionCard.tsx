'use client';

import React from 'react';

interface QuestionCardProps {
  number: number;
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  isRTL?: boolean;
}

export default function QuestionCard({
  number,
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  isRTL = false,
}: QuestionCardProps) {
  return (
    <div className="mb-8">
      <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-gray-400 text-lg font-normal">{number}</span>
        <div className="flex-1">
          <h3 className="text-gray-900 text-base font-medium mb-2">{title}</h3>
          <p className="text-gray-500 text-sm mb-3">{subtitle}</p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[100px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>
    </div>
  );
}

