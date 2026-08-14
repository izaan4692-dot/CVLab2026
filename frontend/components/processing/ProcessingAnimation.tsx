import { FileText, Sparkles, Settings } from 'lucide-react';

export default function ProcessingAnimation() {
  return (
    <div className="flex items-center justify-center gap-6">
      <div className="relative">
        <div className="bg-white rounded-2xl shadow-lg p-5 w-28 h-32 flex flex-col items-center justify-center">
          <div className="bg-[#E5E5EA] rounded-xl p-3 mb-3">
            <FileText className="w-6 h-6 text-[#6E6E73]" />
          </div>
          <div className="w-full space-y-1.5">
            <div className="h-1.5 bg-[#E5E5EA] rounded-full w-full"></div>
            <div className="h-1.5 bg-[#E5E5EA] rounded-full w-3/4"></div>
          </div>
        </div>
      </div>

      <div className="relative animate-pulse">
        <div className="bg-black rounded-full p-5 shadow-xl">
          <Sparkles className="w-8 h-8 text-white" fill="white" />
        </div>
      </div>

      <div className="relative">
        <div className="bg-black rounded-2xl shadow-lg p-5 w-28 h-32 flex flex-col items-center justify-center">
          <div className="bg-white rounded-xl p-3 mb-3">
            <Settings className="w-6 h-6 text-black" />
          </div>
          <div className="w-full space-y-1.5">
            <div className="h-1.5 bg-[#3A3A3C] rounded-full w-full"></div>
            <div className="h-1.5 bg-[#3A3A3C] rounded-full w-5/6"></div>
            <div className="h-1.5 bg-[#3A3A3C] rounded-full w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

