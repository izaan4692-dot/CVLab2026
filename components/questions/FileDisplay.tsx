'use client';

import React from 'react';
import { FileText } from 'lucide-react';

interface FileDisplayProps {
  fileName: string;
  fileSize: string;
  pageCount: number;
  status: string;
  isRTL?: boolean;
}

export default function FileDisplay({
  fileName,
  fileSize,
  pageCount,
  status,
  isRTL = false,
}: FileDisplayProps) {
  return (
    <div className={`flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-red-600" />
        </div>
        <div className={isRTL ? 'text-right' : ''}>
          <p className="text-gray-900 text-sm font-medium">{fileName}</p>
          <p className="text-gray-500 text-xs">
            {fileSize} • {pageCount} pages
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-green-600 text-sm font-medium">{status}</span>
      </div>
    </div>
  );
}

