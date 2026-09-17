import React, { useState } from 'react';
import { X, Check, Copy, Download, Monitor, AppWindow } from 'lucide-react';

interface DesktopExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopExportModal: React.FC<DesktopExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const devCommand = `npm install
npm run electron:dev`;

  const buildExeCommand = `npm run electron:build`;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Hourglass for Windows Desktop
              </h2>
              <p className="text-xs text-slate-400">
                Run natively as floating, borderless, transparent desktop widgets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-200 text-sm">
          {/* Quick Intro */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/20 text-xs leading-relaxed">
            <p className="text-slate-300 font-medium">
              Hourglass is built with a dual architecture: it runs fully here in the browser/cloud preview, and includes the complete Electron configuration and native window drivers so you can compile it into a native Windows <span className="text-amber-400 font-mono font-semibold">.exe installer</span>.
            </p>
          </div>

          {/* Step 1: Export / Clone */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <span>Step 1: Download or Export Project</span>
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Export the source code via the AI Studio Settings menu (<span className="text-slate-200">Export to GitHub</span> or <span className="text-slate-200">Download ZIP</span>).
            </p>
          </div>

          {/* Step 2: Run in Development Mode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>Step 2: Run as Desktop App (Development)</span>
              </h3>
              <button
                onClick={() => copyToClipboard(devCommand, 'dev')}
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'dev' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-200/90 overflow-x-auto">
              {devCommand}
            </pre>
            <p className="text-[11px] text-slate-400 mt-1">
              Launches borderless, transparent, always-on-top floating windows with Windows tray support.
            </p>
          </div>

          {/* Step 3: Package into .exe Installer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>Step 3: Build Windows .exe Installer</span>
              </h3>
              <button
                onClick={() => copyToClipboard(buildExeCommand, 'build')}
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'build' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-200/90 overflow-x-auto">
              {buildExeCommand}
            </pre>
            <p className="text-[11px] text-slate-400 mt-1">
              Creates <span className="font-mono text-amber-300">Hourglass-Setup-1.0.0.exe</span> (installer) and portable standalone <span className="font-mono text-amber-300">Hourglass-Portable.exe</span> in <span className="font-mono">dist_electron/</span>.
            </p>
          </div>

          {/* Feature Guarantee Checklist */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
              Windows Native Features Implemented
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>True borderless transparent windows</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Always on Top by default</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Multiple independent instances</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Windows System Tray menu</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Hardware timestamp accuracy</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Saves positions, sizes & settings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
