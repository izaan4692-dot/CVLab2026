interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="relative w-full h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-black rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {label && (
        <div className="flex justify-between items-center mt-2">
          <p className="text-[#6E6E73] text-sm">{label}</p>
          <p className="text-[#1D1D1F] text-sm font-medium">{progress}%</p>
        </div>
      )}
    </div>
  );
}

