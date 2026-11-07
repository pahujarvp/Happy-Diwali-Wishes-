import React from 'react';
import confetti from 'canvas-confetti';
import { audioStore } from '../valley/audio';

interface BottomDiyasProps {
  onDiyaClick?: (index: number) => void;
}

export const BottomDiyas: React.FC<BottomDiyasProps> = ({ onDiyaClick }) => {
  const handleDiyaTap = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    audioStore.playDiyaIgnitionSound();
    onDiyaClick?.(idx);

    // Subtle gentle golden festive sparkles from the clicked diya
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 28,
      spread: 45,
      origin: { x, y },
      colors: ['#fbbf24', '#f59e0b', '#fde047', '#ffffff'],
      disableForReducedMotion: true,
    });
  };

  // 5 Diyas with center one as the grand centerpiece (tuned for mobile)
  const diyas = [
    { id: 1, scale: 'scale-75 sm:scale-90', size: 'w-10 sm:w-12 h-12 sm:h-14', flameSize: 'w-4 sm:w-5 h-7 sm:h-8', label: 'Peace' },
    { id: 2, scale: 'scale-85 sm:scale-100', size: 'w-12 sm:w-14 h-14 sm:h-16', flameSize: 'w-5 sm:w-6 h-8 sm:h-9', label: 'Health' },
    { id: 3, scale: 'scale-105 sm:scale-120 -translate-y-1 sm:-translate-y-2', size: 'w-14 sm:w-18 h-16 sm:h-20', flameSize: 'w-7 sm:w-8 h-10 sm:h-12', label: 'Prosperity', isGrand: true },
    { id: 4, scale: 'scale-85 sm:scale-100', size: 'w-12 sm:w-14 h-14 sm:h-16', flameSize: 'w-5 sm:w-6 h-8 sm:h-9', label: 'Joy' },
    { id: 5, scale: 'scale-75 sm:scale-90', size: 'w-10 sm:w-12 h-12 sm:h-14', flameSize: 'w-4 sm:w-5 h-7 sm:h-8', label: 'Light' },
  ];

  return (
    <div className="fixed bottom-2 sm:bottom-3 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
      {/* Soft warm light ground cast */}
      <div className="w-64 sm:w-96 h-10 sm:h-12 bg-gradient-to-t from-amber-500/20 via-amber-500/5 to-transparent rounded-full blur-xl -mb-4 pointer-events-none" />

      {/* Row of 5 Diyas */}
      <div className="flex items-end justify-center gap-1.5 sm:gap-6 px-2 sm:px-4">
        {diyas.map((diya, idx) => (
          <div
            key={diya.id}
            onClick={(e) => handleDiyaTap(idx, e)}
            className={`relative flex flex-col items-center cursor-pointer pointer-events-auto group transition-transform duration-300 active:scale-95 hover:scale-105 ${diya.scale}`}
            title={`Light Diya of ${diya.label}`}
          >
            {/* Flickering Flame SVG */}
            <div className={`relative ${diya.flameSize} diya-flame-glow mb-[-4px] z-10`}>
              <svg viewBox="0 0 40 60" className="w-full h-full overflow-visible">
                <defs>
                  {/* Outer amber gradient */}
                  <linearGradient id={`flameGrad-${idx}`} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="20%" stopColor="#f97316" />
                    <stop offset="65%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>

                  {/* Core golden-white gradient */}
                  <linearGradient id={`flameCore-${idx}`} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="40%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>

                {/* Outer flame halo */}
                <circle cx="20" cy="30" r="16" fill="rgba(245, 158, 11, 0.25)" filter="blur(4px)" />

                {/* Main flame teardrop */}
                <path
                  d="M20 4 C28 24, 34 38, 20 54 C6 38, 12 24, 20 4 Z"
                  fill={`url(#flameGrad-${idx})`}
                />

                {/* Inner bright white flame core */}
                <path
                  d="M20 18 C24 30, 27 40, 20 50 C13 40, 16 30, 20 18 Z"
                  fill={`url(#flameCore-${idx})`}
                  opacity="0.95"
                />
              </svg>
            </div>

            {/* Earthen Clay Diya Bowl SVG */}
            <div className={`${diya.size} relative`}>
              <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                <defs>
                  <linearGradient id={`diyaClay-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="45%" stopColor="#92400e" />
                    <stop offset="100%" stopColor="#451a03" />
                  </linearGradient>

                  <linearGradient id={`diyaRim-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="50%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>

                  <radialGradient id={`diyaOil-${idx}`} cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#78350f" stopOpacity="0.7" />
                  </radialGradient>
                </defs>

                {/* Base shadow */}
                <ellipse cx="50" cy="54" rx="42" ry="5" fill="rgba(0,0,0,0.6)" filter="blur(2px)" />

                {/* Diya clay body */}
                <path
                  d="M10 24 C10 46, 26 56, 50 56 C74 56, 90 46, 90 24 C82 28, 68 30, 50 30 C32 30, 18 28, 10 24 Z"
                  fill={`url(#diyaClay-${idx})`}
                />

                {/* Golden rim lip */}
                <ellipse cx="50" cy="24" rx="42" ry="9" fill={`url(#diyaRim-${idx})`} opacity="0.9" />

                {/* Inner oil pool */}
                <ellipse cx="50" cy="25" rx="35" ry="6.5" fill={`url(#diyaOil-${idx})`} />

                {/* Center wick holder reflection */}
                <ellipse cx="50" cy="24" rx="6" ry="2.5" fill="#fef08a" opacity="0.85" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
