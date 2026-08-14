'use client';

interface QuestionCardProps {
  number: number;
  title: string;
  subtitle?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  isRTL?: boolean;
}

export default function QuestionCard({
  number,
  title,
  value,
  onChange,
}: QuestionCardProps) {
  return (
    <div className="mb-8" dir="ltr">
      <div className="flex gap-4">
        <span className="text-gray-400 text-lg font-normal">{number}</span>
        <div className="flex-1">
          <h3 className="text-gray-900 text-base font-normal mb-2 text-left">{title}</h3>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[100px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-left"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}

