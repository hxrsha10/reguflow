
import React from 'react';

export const Logo: React.FC<{ className?: string, hideText?: boolean }> = ({ className = "w-12 h-12", hideText = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className} print:hidden`}>
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-sm">
        {/* Main Brain Silhouette - Organic and Smooth */}
        <path d="M60 10C35 10 15 25 15 50C15 65 25 78 40 85C45 87 55 82 60 75C65 82 75 87 80 85C95 78 105 65 105 50C105 25 85 10 60 10Z" 
              fill="#1D70B8" />
        
        {/* The "Flow" Knot Detail - Continuous White Stroke */}
        <path d="M45 45C45 35 55 30 60 30C68 30 75 38 75 48C75 60 60 70 50 70C35 70 28 60 28 50C28 35 40 25 55 25C65 25 72 32 75 40C80 55 92 65 100 65" 
              stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Dark Blue Contrast Overlay for Depth */}
        <path d="M45 45C45 35 55 30 60 30C68 30 75 38 75 48C75 60 60 70 50 70" 
              stroke="#003078" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
      {!hideText && (
        <span className="mt-2 text-[0.75rem] font-black tracking-[0.25em] text-[#003078] uppercase">
          REGUFLOW
        </span>
      )}
    </div>
  );
};
