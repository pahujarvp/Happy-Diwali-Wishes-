import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Share2 } from 'lucide-react';
import { ValleyScene } from './valley/ValleyScene';
import { audioStore } from './valley/audio';
import { DiyaWishesModal } from './components/DiyaWishesModal';
import { BottomDiyas } from './components/BottomDiyas';
import { FireworksCanvas, FireworksCanvasHandle } from './components/FireworksCanvas';

export default function App() {
  const valleyRef = useRef<HTMLDivElement>(null);
  const valleyInstanceRef = useRef<ValleyScene | null>(null);
  const fireworksRef = useRef<FireworksCanvasHandle>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read initial sender name from URL query parameter (e.g. ?from=Amit or ?name=Priya)
  const [senderName, setSenderName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromParam = params.get('from') || params.get('name');
      if (fromParam) return fromParam.trim();
    }
    return 'Rohit Pahuja';
  });

  useEffect(() => {
    // Start background devotional mp3 music unmuted by default
    audioStore.initAudio();
    setIsMuted(false);

    if (!valleyRef.current) return;

    // Initialize 3D Valley Engine
    const valley = new ValleyScene(
      valleyRef.current,
      () => {
        setIsLoaded(true);
      },
      () => {
        setIsIntroDone(true);
      }
    );

    valleyInstanceRef.current = valley;

    return () => {
      valley.dispose();
      valleyInstanceRef.current = null;
    };
  }, []);

  const handleToggleSound = () => {
    const muted = audioStore.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Sound Muted' : 'Ram Siya Ram Devotional Music 🪔');
  };

  const handleTouchLaunch = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    // Launch 2x fireworks of different colors simultaneously
    fireworksRef.current?.launchDouble(touchX);
    valleyInstanceRef.current?.launchFirework();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  };

  return (
    <div className="mobile-stage">
      {/* 9:16 Responsive Mobile Container that adapts to any mobile phone */}
      <div className="mobile-frame" onPointerDown={handleTouchLaunch}>
        {/* 3D Night Flower Valley Canvas Container */}
        <div id="valley" ref={valleyRef} aria-hidden="true">
          <div className="js-canvas-container" />
        </div>

        {/* Dedicated Fireworks Canvas Animation Layer */}
        <FireworksCanvas ref={fireworksRef} />

        {/* Atmospheric Vignette Overlay */}
        <div className="vignette-overlay" />

        {/* Interface Overlay Layer */}
        <div className={`ui ${isIntroDone ? 'on' : ''}`} id="ui">
          {/* Top Header Bar */}
          <header className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/25 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 diya-flame inline-block shadow-[0_0_8px_#f59e0b]" />
              <span className="font-semibold text-xs tracking-wide text-amber-100">
                {senderName}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-amber-400/90 font-medium px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30">
                Diwali 2026
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-amber-400/50 text-amber-200 hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-lg"
                aria-label="Personalize & Share Greeting"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-semibold text-xs tracking-wider uppercase text-amber-200">
                  Share Wishes
                </span>
              </button>
            </div>
          </header>

          {/* Simple, Elegant, High-Contrast Center Message (Mobile-Optimized) */}
          <section className="hero px-3 sm:px-4 w-full">
            <div className="relative w-full max-w-[88vw] sm:max-w-md mx-auto bg-black/80 backdrop-blur-xl border border-amber-400/35 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.95)] text-center">
              {/* Auspicious Greeting Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">
                <span>✦</span>
                <span>Shubh Deepavali</span>
                <span>✦</span>
              </div>

              {/* Main Festive Headline in Royal Serif */}
              <h1 className="font-cinzel text-xl sm:text-2xl tracking-wide uppercase text-[#ffffff] font-bold leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                Wishing You a Happy Diwali
              </h1>

              {/* Simple, Heartfelt Blessing Message */}
              <p className="mt-2 text-center text-stone-200 text-xs sm:text-sm font-normal leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-w-xs sm:max-w-sm mx-auto">
                May the divine glow of Diwali fill your life with boundless joy,
                prosperity, vibrant health, and eternal peace.
              </p>

              {/* Prominent Elegant Signature (Uncluttered, pencil removed) */}
              <div className="pt-2.5 border-t border-amber-400/25 mt-2.5">
                <p className="text-[10px] sm:text-xs text-amber-200/80 uppercase tracking-widest font-medium">
                  With warm regards,
                </p>

                <div className="mt-0.5 flex items-center justify-center">
                  <p className="font-signature text-3xl sm:text-4xl text-amber-300 tracking-normal leading-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
                    {senderName}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5 Glowing Diyas at the Bottom of the Screen */}
          <BottomDiyas
            onDiyaClick={(idx) => {
              showToast(`🪔 Diya ${idx + 1} lit with love & prosperity!`);
              // Launch 2x celebratory fireworks of different colors on tap
              fireworksRef.current?.launchDouble();
              valleyInstanceRef.current?.launchFirework();
              audioStore.playDiyaIgnitionSound();
            }}
          />

          {/* Sound Toggle (Right Side above Diyas inside 9:16 frame) */}
          <div className="absolute bottom-24 right-4 sm:right-6 z-30">
            <button
              className="w-9 h-9 rounded-full bg-black/65 backdrop-blur-md border border-amber-400/30 flex items-center justify-center text-amber-300 hover:text-amber-200 shadow-xl transition-all active:scale-95"
              id="sound"
              aria-pressed={!isMuted}
              aria-label="Ambient sound"
              onClick={handleToggleSound}
              title={isMuted ? 'Turn on sound' : 'Mute sound'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-stone-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Full-screen Loader inside frame */}
        <div className={`loader ${isLoaded ? 'gone' : ''}`} id="loader">
          <div className="flex flex-col items-center gap-3">
            <span />
            <span className="text-[11px] tracking-[0.25em] uppercase text-amber-200/70 mt-3 font-mono">
              Lighting Sacred Valley...
            </span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/90 border border-amber-400/40 text-amber-200 text-xs font-medium tracking-wide shadow-2xl backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* Personalize & Share Greeting Modal */}
      <DiyaWishesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        senderName={senderName}
        onUpdateSenderName={(name) => setSenderName(name)}
        onDiyaLit={() => {
          showToast('🪔 Your Diya is glowing with eternal light!');
          fireworksRef.current?.launchDouble();
          valleyInstanceRef.current?.launchFirework();
        }}
      />
    </div>
  );
}
