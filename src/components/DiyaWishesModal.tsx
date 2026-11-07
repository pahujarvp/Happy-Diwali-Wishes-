import React, { useState } from 'react';
import { Flame, Sparkles, Share2, Check, X, MessageCircle, Copy, User } from 'lucide-react';

interface DiyaWishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiyaLit?: () => void;
  senderName: string;
  onUpdateSenderName: (name: string) => void;
}

export const DiyaWishesModal: React.FC<DiyaWishesModalProps> = ({
  isOpen,
  onClose,
  senderName,
  onUpdateSenderName,
}) => {
  const [copied, setCopied] = useState(false);
  const [customName, setCustomName] = useState(senderName);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomName(val);
    onUpdateSenderName(val.trim() || 'Rohit Pahuja');

    // Update query string in browser without reload
    const url = new URL(window.location.href);
    if (val.trim()) {
      url.searchParams.set('from', val.trim());
    } else {
      url.searchParams.delete('from');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const activeName = customName.trim() || 'Rohit Pahuja';

  // Construct personalized share link
  const getPersonalizedUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?from=${encodeURIComponent(activeName)}`;
  };

  const shareText = `🪔 Happy Diwali Wishes! 🪔\n\nMay the divine glow of diyas illuminate your life with endless happiness, good health, peace, and prosperity.\n\nWishing you and your family a sparkling and joyful Diwali! ✨\n\nWarm regards,\n${activeName}\n\n🌟 Experience the Magic of Diwali in 3D! 🌟\n👇 Open your special 3D Diwali Night Valley Greeting here:\n\n${getPersonalizedUrl()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Happy Diwali Wishes from ${activeName}`,
          text: shareText,
        });
        return;
      } catch {
        // Ignored or cancelled
      }
    }
    handleCopy();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-all duration-300 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[94vw] sm:max-w-md bg-[#0b0a14] border border-amber-400/35 rounded-3xl p-5 sm:p-6 pb-6 shadow-2xl text-[#f5efe2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative golden ambient glows */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-1 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400/35 flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-400 diya-flame" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <span className="text-[10px] tracking-[0.24em] uppercase text-amber-300 font-semibold">
            Shubh Deepavali 2026
          </span>

          <h2 className="font-royal text-xl sm:text-2xl font-bold tracking-normal text-[#ffffff] mt-0.5">
            Personalize & Share
          </h2>

          <p className="text-[11px] sm:text-xs text-stone-300 mt-0.5 max-w-xs">
            Send this magical 3D night valley greeting to friends and family with your own name!
          </p>

          {/* Personalization Input Card */}
          <div className="w-full mt-3 p-3.5 rounded-2xl bg-black/60 border border-amber-400/25 text-left space-y-1.5">
            <label className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Your Name / Sender Name</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={customName}
                onChange={handleNameChange}
                placeholder="Enter your name (e.g. Rohit Pahuja)"
                maxLength={40}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/40 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs sm:text-sm text-[#ffffff] placeholder-stone-500"
              />
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-400">
              Live Signature:{' '}
              <span className="font-signature text-xl text-amber-300 ml-1">
                {activeName}
              </span>
            </p>
          </div>

          {/* Action Sharing Buttons */}
          <div className="w-full mt-3.5 space-y-2">
            {/* WhatsApp Direct Button */}
            <button
              onClick={handleWhatsApp}
              className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-stone-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-stone-950 text-stone-950" />
              <span>Share on WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* Copy Wishes Message & Link Button */}
              <button
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl border border-amber-400/35 bg-white/5 hover:bg-white/10 text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Copy Wishes</span>
                  </>
                )}
              </button>

              {/* Native Mobile Share */}
              <button
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl border border-amber-400/35 bg-white/5 hover:bg-white/10 text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span>More Options</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
