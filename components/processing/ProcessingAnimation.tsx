import Image from 'next/image';
import { Sparkles } from 'lucide-react';

export default function ProcessingAnimation() {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Left card - White with document icon */}
      <div className="relative">
        <Image
          src="/assets/processing_icon.png"
          alt="Processing"
          width={112}
          height={128}
          className="w-28 h-32 object-contain"
        />
      </div>

      {/* Center - Sparkles animation */}
      <div className="relative animate-pulse">
        <div className="bg-black rounded-full p-5 shadow-xl">
          <Sparkles className="w-8 h-8 text-white" fill="white" />
        </div>
      </div>

      {/* Right card - Black with settings icon */}
      <div className="relative">
        <Image
          src="/assets/processing_icon2.png"
          alt="Optimizing"
          width={112}
          height={128}
          className="w-28 h-32 object-contain"
        />
      </div>
    </div>
  );
}

