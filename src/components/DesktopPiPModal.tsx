import React from 'react';
import { ExternalLink, X, Monitor, ArrowRight, Download, Sparkles } from 'lucide-react';

interface DesktopPiPModalProps {
  isOpen: boolean;
  onClose: () => void;
  timerName?: string;
  onOpenDesktopGuide: () => void;
}

export const DesktopPiPModal: React.FC<DesktopPiPModalProps> = ({
  isOpen,
  onClose,
  timerName = 'Hourglass',
  onOpenDesktopGuide,
}) => {
  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    // Generate URL with auto-pip flag
    const url = new URL(window.location.href);
    url.searchParams.set('pip', 'true');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Float {timerName} on Windows Desktop
              </h2>
              <p className="text-xs text-slate-400">
                Move freely outside the browser over all your apps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Explanation */}
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Because the application is currently running inside the embedded <strong>AI Studio preview iframe</strong>, the browser&apos;s security policy requires opening it in a <strong>top-level browser tab</strong> to activate the floating Picture-in-Picture desktop window.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Step 1: Open in a New Tab</span>
            </div>
            <p className="text-slate-400">
              Click the button below to launch Hourglass in a full browser tab. From there, Picture-in-Picture activates instantly, giving you a borderless floating hourglass with zero backdrop.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleOpenInNewTab}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <span>Open in New Tab to Float</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenDesktopGuide();
            }}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Windows .exe App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
