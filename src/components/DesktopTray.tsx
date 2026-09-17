import React, { useState, useEffect, useRef } from 'react';
import {
  Hourglass,
  Plus,
  Play,
  Pause,
  Eye,
  EyeOff,
  Settings,
  X,
  Monitor,
  Check,
  ChevronUp,
  Volume2,
} from 'lucide-react';

interface DesktopTrayProps {
  activeCount: number;
  onNewHourglass: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onOpenManager: () => void;
  onOpenDesktopGuide: () => void;
  backgroundTheme: string;
  onChangeBackgroundTheme: (theme: string) => void;
}

export const DesktopTray: React.FC<DesktopTrayProps> = ({
  activeCount,
  onNewHourglass,
  onShowAll,
  onHideAll,
  onPauseAll,
  onResumeAll,
  onOpenManager,
  onOpenDesktopGuide,
  backgroundTheme,
  onChangeBackgroundTheme,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowBgMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const backgroundOptions = [
    { id: 'dark-slate', label: 'Dark Slate (Default)' },
    { id: 'windows-bloom', label: 'Windows Modern Wallpaper' },
    { id: 'archicad', label: 'CAD / Workspace Backdrop' },
    { id: 'minimal-light', label: 'Light Document Backdrop' },
    { id: 'clean-transparent', label: 'Checkerboard (Transparent)' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bottom-0 left-0 right-0 h-10 bg-slate-950/85 backdrop-blur-xl border-t border-slate-800/80 z-[7000] flex items-center justify-between px-4 select-none"
    >
      {/* Left: Windows Start & Quick Hourglass Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenManager}
          title="Open Hourglass Manager"
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
        >
          <Hourglass className="w-3.5 h-3.5" />
          <span className="font-semibold tracking-wide">Hourglass</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] font-mono">
            {activeCount}
          </span>
        </button>

        <button
          onClick={onNewHourglass}
          title="New Hourglass (Ctrl+Alt+H)"
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        {/* Background environment simulator picker */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBgMenu(!showBgMenu);
              setShowMenu(false);
            }}
            title="Switch simulated desktop background to test contrast and transparency"
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop Backdrop</span>
          </button>

          {showBgMenu && (
            <div className="absolute bottom-11 left-0 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Simulated Desktop
              </div>
              {backgroundOptions.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    onChangeBackgroundTheme(bg.id);
                    setShowBgMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <span>{bg.label}</span>
                  {backgroundTheme === bg.id && (
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: System Tray & Clock */}
      <div className="flex items-center gap-3">
        {/* Tray Icon with Notification Popup */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMenu(!showMenu);
              setShowBgMenu(false);
            }}
            title="Hourglass System Tray Menu (Right-click or click)"
            onContextMenu={(e) => {
              e.preventDefault();
              setShowMenu(true);
            }}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
              showMenu
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-amber-300 border-transparent'
            }`}
          >
            <Hourglass className="w-4 h-4" />
            <ChevronUp className="w-3 h-3 opacity-60" />
          </button>

          {/* Windows System Tray Context Menu */}
          {showMenu && (
            <div className="absolute bottom-11 right-0 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-2 divide-y divide-slate-800/60">
              <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>SYSTEM TRAY</span>
                <span className="text-[10px] font-mono text-amber-400">
                  {activeCount} running
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNewHourglass();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 hover:text-amber-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Hourglass</span>
                </button>
                <button
                  onClick={() => {
                    onOpenManager();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 transition-colors"
                >
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>Manage All Hourglasses</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onResumeAll();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resume All</span>
                </button>
                <button
                  onClick={() => {
                    onPauseAll();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause All</span>
                </button>
                <button
                  onClick={() => {
                    onShowAll();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show All</span>
                </button>
                <button
                  onClick={() => {
                    onHideAll();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide All</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    onOpenDesktopGuide();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-amber-400 font-medium transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Desktop App & .exe Setup</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Windows System Clock */}
        <div className="text-[11px] font-mono text-slate-400 tracking-tight">
          {currentTime}
        </div>
      </div>
    </div>
  );
};
