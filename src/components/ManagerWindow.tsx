import React from 'react';
import {
  Hourglass,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Trash2,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Keyboard,
  Download,
} from 'lucide-react';
import { HourglassTimer } from '../types';
import { calculateTimerState, getTheme } from '../utils/time';

interface ManagerWindowProps {
  timers: HourglassTimer[];
  isOpen: boolean;
  onClose: () => void;
  onNewHourglass: () => void;
  onEditTimer: (timer: HourglassTimer) => void;
  onDeleteTimer: (id: string) => void;
  onTogglePauseTimer: (timer: HourglassTimer) => void;
  onRestartTimer: (timer: HourglassTimer) => void;
  onBringToFront: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onOpenDesktopGuide: () => void;
}

export const ManagerWindow: React.FC<ManagerWindowProps> = ({
  timers,
  isOpen,
  onClose,
  onNewHourglass,
  onEditTimer,
  onDeleteTimer,
  onTogglePauseTimer,
  onRestartTimer,
  onBringToFront,
  onToggleVisibility,
  onPauseAll,
  onResumeAll,
  onOpenDesktopGuide,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-12 right-6 z-[8000] w-96 max-h-[85vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Hourglass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-tight">MY HOURGLASSES</h2>
            <p className="text-[10px] text-slate-400">{timers.length} active window{timers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewHourglass}
            title="Create new hourglass (Ctrl+Alt+H)"
            className="p-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Actions Bar */}
      <div className="px-5 py-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onResumeAll}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
          >
            <Play className="w-2.5 h-2.5" /> Resume All
          </button>
          <button
            onClick={onPauseAll}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
          >
            <Pause className="w-2.5 h-2.5" /> Pause All
          </button>
        </div>

        <button
          onClick={onOpenDesktopGuide}
          title="Windows Desktop (.exe) Guide"
          className="text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <Download className="w-3 h-3" /> Desktop App (.exe)
        </button>
      </div>

      {/* Timers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
        {timers.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <Hourglass className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-xs text-slate-400">No active hourglasses.</p>
            <button
              onClick={onNewHourglass}
              className="mt-3 px-3 py-1.5 text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Create your first hourglass
            </button>
          </div>
        ) : (
          timers.map((timer) => {
            const state = calculateTimerState(timer);
            const theme = getTheme(timer.themeId);
            const isHidden = timer.minimized;

            return (
              <div
                key={timer.id}
                onClick={() => onBringToFront(timer.id)}
                className={`pt-2.5 first:pt-0 group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                  isHidden ? 'opacity-50 bg-slate-950/30' : 'bg-slate-950/60 hover:bg-slate-800/40'
                } border border-slate-800/60 hover:border-slate-700`}
              >
                {/* Timer Info & Thumbnail */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-8 h-10 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105"
                    style={{
                      borderColor: theme.sandPrimary,
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    }}
                  >
                    <Hourglass
                      className="w-4 h-4"
                      style={{ color: theme.sandPrimary }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {timer.name}
                      </span>
                      {timer.alwaysOnTop && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          TOP
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-amber-300/90 font-medium">
                      {state.formattedRemaining}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {state.subtitle} • {state.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Quick Item Actions */}
                <div
                  className="flex items-center gap-1 pl-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Play / Pause */}
                  <button
                    title={timer.isPaused ? 'Resume' : 'Pause'}
                    onClick={() => onTogglePauseTimer(timer)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    {timer.isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  {/* Restart */}
                  <button
                    title="Restart"
                    onClick={() => onRestartTimer(timer)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    title={isHidden ? 'Show window' : 'Hide window'}
                    onClick={() => onToggleVisibility(timer.id)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Edit */}
                  <button
                    title="Edit settings"
                    onClick={() => onEditTimer(timer)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    title="Delete timer"
                    onClick={() => onDeleteTimer(timer.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer & Shortcut Hints */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5 text-slate-500" />
          <span>Ctrl+Alt+H: New • Ctrl+Alt+P: Pause</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
      </div>
    </div>
  );
};
