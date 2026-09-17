import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Hourglass, HelpCircle, Download, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { HourglassTimer } from './types';
import { loadTimersFromStorage, saveTimersToStorage } from './utils/storage';
import { HourglassWidget } from './components/HourglassWidget';
import { TimerSetupModal } from './components/TimerSetupModal';
import { ManagerWindow } from './components/ManagerWindow';
import { DesktopTray } from './components/DesktopTray';
import { DesktopExportModal } from './components/DesktopExportModal';
import { DesktopPiPModal } from './components/DesktopPiPModal';
import { openHourglassInDesktopPiP } from './utils/pip';

export default function App() {
  const [timers, setTimers] = useState<HourglassTimer[]>(() => loadTimersFromStorage());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<HourglassTimer | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isDesktopGuideOpen, setIsDesktopGuideOpen] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(20);
  const [backgroundTheme, setBackgroundTheme] = useState('dark-slate');
  const [hideBackdrop, setHideBackdrop] = useState(false);
  const [isPipModalOpen, setIsPipModalOpen] = useState(false);
  const [pipTimerName, setPipTimerName] = useState('Hourglass');

  // Save changes to persistence whenever timers change
  useEffect(() => {
    saveTimersToStorage(timers);
    // If running in native Electron
    if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: { saveState: (d: unknown) => void } }).electronAPI?.saveState) {
      (window as unknown as { electronAPI: { saveState: (d: unknown) => void } }).electronAPI.saveState(timers);
    }
  }, [timers]);

  // Bring a widget to the front
  const bringToFront = useCallback((id: string) => {
    setMaxZIndex((prev) => {
      const nextZ = prev + 1;
      setTimers((current) =>
        current.map((t) => (t.id === id ? { ...t, zIndex: nextZ } : t))
      );
      return nextZ;
    });
  }, []);

  // Update a single timer's attributes (position, size, state, etc.)
  const updateTimer = useCallback((id: string, partial: Partial<HourglassTimer>) => {
    setTimers((current) =>
      current.map((t) => (t.id === id ? { ...t, ...partial } : t))
    );
  }, []);

  // Delete a timer
  const deleteTimer = useCallback((id: string) => {
    setTimers((current) => current.filter((t) => t.id !== id));
  }, []);

  // Toggle pause on a timer
  const togglePauseTimer = useCallback((timer: HourglassTimer) => {
    const now = Date.now();
    if (timer.type === 'daily') {
      updateTimer(timer.id, { isPaused: !timer.isPaused });
      return;
    }

    if (!timer.isPaused) {
      const currentElapsed = (timer.accumulatedElapsedMs || 0) + (timer.startedAt ? now - timer.startedAt : 0);
      updateTimer(timer.id, {
        isPaused: true,
        accumulatedElapsedMs: currentElapsed,
        startedAt: null,
      });
    } else {
      updateTimer(timer.id, {
        isPaused: false,
        startedAt: now,
      });
    }
  }, [updateTimer]);

  // Restart a timer
  const restartTimer = useCallback((timer: HourglassTimer) => {
    if (timer.type === 'daily') {
      updateTimer(timer.id, { isPaused: false });
      return;
    }
    updateTimer(timer.id, {
      accumulatedElapsedMs: 0,
      startedAt: Date.now(),
      isPaused: false,
    });
  }, [updateTimer]);

  // Pop out hourglass into native OS floating window
  const handleRequestPiP = useCallback(async (targetTimer?: HourglassTimer) => {
    const timerToUse = targetTimer || timers.find((t) => !t.minimized) || timers[0];
    if (!timerToUse) {
      setIsModalOpen(true);
      return;
    }
    const result = await openHourglassInDesktopPiP(timerToUse, (partial) => updateTimer(timerToUse.id, partial));
    if (!result.success) {
      setPipTimerName(timerToUse.name);
      setIsPipModalOpen(true);
    }
  }, [timers, updateTimer]);

  // Check if opened with ?pip=true in a top-level tab
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pip') === 'true') {
      const activeTimer = timers.find((t) => !t.minimized) || timers[0];
      if (activeTimer) {
        openHourglassInDesktopPiP(activeTimer, (partial) => updateTimer(activeTimer.id, partial));
      }
    }
  }, [timers, updateTimer]);

  // Pause all active timers
  const pauseAllTimers = useCallback(() => {
    const now = Date.now();
    setTimers((current) =>
      current.map((t) => {
        if (t.type === 'daily') {
          return { ...t, isPaused: true };
        }
        if (!t.isPaused) {
          const currentElapsed = (t.accumulatedElapsedMs || 0) + (t.startedAt ? now - t.startedAt : 0);
          return {
            ...t,
            isPaused: true,
            accumulatedElapsedMs: currentElapsed,
            startedAt: null,
          };
        }
        return t;
      })
    );
  }, []);

  // Resume all timers
  const resumeAllTimers = useCallback(() => {
    const now = Date.now();
    setTimers((current) =>
      current.map((t) => {
        if (t.isPaused) {
          return {
            ...t,
            isPaused: false,
            startedAt: now,
          };
        }
        return t;
      })
    );
  }, []);

  // Show all windows
  const showAllWindows = useCallback(() => {
    setTimers((current) => current.map((t) => ({ ...t, minimized: false })));
  }, []);

  // Hide all windows
  const hideAllWindows = useCallback(() => {
    setTimers((current) => current.map((t) => ({ ...t, minimized: true })));
  }, []);

  // Toggle single timer visibility
  const toggleVisibility = useCallback((id: string) => {
    setTimers((current) =>
      current.map((t) => (t.id === id ? { ...t, minimized: !t.minimized } : t))
    );
  }, []);

  // Save created or edited timer
  const handleSaveTimerModal = (data: Partial<HourglassTimer>) => {
    if (editingTimer) {
      updateTimer(editingTimer.id, data);
    } else {
      // Calculate a staggered position for the new window
      const count = timers.length;
      const offsetX = 50 + (count % 5) * 190;
      const offsetY = 60 + Math.floor(count / 5) * 50;

      const newTimer: HourglassTimer = {
        id: `timer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: data.name || 'Hourglass',
        type: data.type || 'task',
        durationMs: data.durationMs || 25 * 60 * 1000,
        accumulatedElapsedMs: 0,
        startedAt: Date.now(),
        startTimeStr: data.startTimeStr,
        endTimeStr: data.endTimeStr,
        dailyRepeat: data.dailyRepeat ?? true,
        autoStart: data.autoStart ?? true,
        isPaused: false,
        soundEnabled: data.soundEnabled ?? true,
        alwaysOnTop: data.alwaysOnTop ?? true,
        themeId: data.themeId || 'amber',
        position: { x: Math.min(window.innerWidth - 220, offsetX), y: Math.min(window.innerHeight - 340, offsetY) },
        size: data.size || { width: 180, height: 300 },
        zIndex: maxZIndex + 1,
        createdAt: Date.now(),
      };

      setMaxZIndex((prev) => prev + 1);
      setTimers((current) => [...current, newTimer]);
    }

    setIsModalOpen(false);
    setEditingTimer(null);
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Alt + H: New Hourglass
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setEditingTimer(null);
        setIsModalOpen(true);
      }

      // Ctrl + Alt + P: Pause / resume the topmost active hourglass
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        if (timers.length > 0) {
          const sorted = [...timers].sort((a, b) => b.zIndex - a.zIndex);
          const topTimer = sorted[0];
          if (topTimer) togglePauseTimer(topTimer);
        }
      }

      // Ctrl + Alt + M: Toggle manager window
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsManagerOpen((prev) => !prev);
      }

      // Escape: Close open modals
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setEditingTimer(null);
        setIsDesktopGuideOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timers, togglePauseTimer]);

  // Determine desktop background styling
  const getBackgroundClass = () => {
    if (hideBackdrop) {
      return 'bg-transparent';
    }
    switch (backgroundTheme) {
      case 'windows-bloom':
        return 'bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/60';
      case 'archicad':
        return 'bg-[#181c24] [background-image:linear-gradient(to_right,#2a3447_1px,transparent_1px),linear-gradient(to_bottom,#2a3447_1px,transparent_1px)] [background-size:32px_32px]';
      case 'minimal-light':
        return 'bg-[#f1f5f9]';
      case 'clean-transparent':
        return 'bg-transparent';
      case 'dark-slate':
      default:
        return 'bg-[#0f172a]';
    }
  };

  return (
    <div
      id="desktop-canvas"
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${getBackgroundClass()}`}
    >
      {/* Top Bar / Quick Actions Bar (Fades out when not hovering to keep desktop clean) */}
      <div className="absolute top-3 left-4 z-[6000] flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => {
            setEditingTimer(null);
            setIsModalOpen(true);
          }}
          title="Create New Hourglass (Ctrl+Alt+H)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Hourglass</span>
        </button>

        {/* Float on Real Desktop (Outside App / PiP) */}
        <button
          onClick={() => handleRequestPiP()}
          title="Pop Out: Float hourglass outside app directly on your Windows desktop"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-lg backdrop-blur-md transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Float Outside App (On Desktop)</span>
        </button>

        {/* Toggle Backdrop Off/On */}
        <button
          onClick={() => setHideBackdrop(!hideBackdrop)}
          title={hideBackdrop ? 'Restore simulated desktop backdrop' : 'Hide backdrop completely'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all ${
            hideBackdrop
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900/60 text-slate-300 hover:text-white border-slate-700/60'
          }`}
        >
          {hideBackdrop ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{hideBackdrop ? 'Show Backdrop' : 'Hide Backdrop'}</span>
        </button>

        <button
          onClick={() => setIsManagerOpen(!isManagerOpen)}
          title="Toggle Management Window (Ctrl+Alt+M)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all ${
            isManagerOpen
              ? 'bg-slate-800 text-white border-slate-600'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-700/60'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5 text-amber-400" />
          <span>My Hourglasses ({timers.filter((t) => !t.minimized).length})</span>
        </button>

        <button
          onClick={() => setIsDesktopGuideOpen(true)}
          title="Run as Windows Desktop App (.exe)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-xs font-medium backdrop-blur-md transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Desktop .exe Guide</span>
        </button>
      </div>

      {/* FLOATING INDEPENDENT HOURGLASS WIDGETS */}
      {timers
        .filter((timer) => !timer.minimized)
        .map((timer) => (
          <HourglassWidget
            key={timer.id}
            timer={timer}
            onUpdate={(partial) => updateTimer(timer.id, partial)}
            onDelete={() => deleteTimer(timer.id)}
            onEdit={() => {
              setEditingTimer(timer);
              setIsModalOpen(true);
            }}
            onBringToFront={() => bringToFront(timer.id)}
            onRequestPiP={handleRequestPiP}
          />
        ))}

      {/* EMPTY STATE HELPER IF NO TIMERS */}
      {timers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="pointer-events-auto p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 text-center max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-inner">
              <Hourglass className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h1 className="text-lg font-bold text-slate-100 mb-1 tracking-tight">Hourglass</h1>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              A minimalist floating desktop timer widget. Keep an eye on remaining time with flowing sand while you work.
            </p>
            <button
              onClick={() => {
                setEditingTimer(null);
                setIsModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Hourglass</span>
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL MANAGEMENT WINDOW ("MY HOURGLASSES") */}
      <ManagerWindow
        timers={timers}
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onNewHourglass={() => {
          setEditingTimer(null);
          setIsModalOpen(true);
        }}
        onEditTimer={(t) => {
          setEditingTimer(t);
          setIsModalOpen(true);
        }}
        onDeleteTimer={deleteTimer}
        onTogglePauseTimer={togglePauseTimer}
        onRestartTimer={restartTimer}
        onBringToFront={bringToFront}
        onToggleVisibility={toggleVisibility}
        onPauseAll={pauseAllTimers}
        onResumeAll={resumeAllTimers}
        onOpenDesktopGuide={() => setIsDesktopGuideOpen(true)}
      />

      {/* TIMER CREATION & EDIT MODAL */}
      {isModalOpen && (
        <TimerSetupModal
          initialTimer={editingTimer}
          onSave={handleSaveTimerModal}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTimer(null);
          }}
        />
      )}

      {/* WINDOWS DESKTOP EXPORT & .EXE GUIDE MODAL */}
      <DesktopExportModal
        isOpen={isDesktopGuideOpen}
        onClose={() => setIsDesktopGuideOpen(false)}
      />

      {/* PICTURE-IN-PICTURE DESKTOP MODAL */}
      <DesktopPiPModal
        isOpen={isPipModalOpen}
        onClose={() => setIsPipModalOpen(false)}
        timerName={pipTimerName}
        onOpenDesktopGuide={() => setIsDesktopGuideOpen(true)}
      />

      {/* WINDOWS SIMULATED SYSTEM TRAY & TASKBAR (Hidden when backdrop is disabled) */}
      {!hideBackdrop && (
        <DesktopTray
          activeCount={timers.filter((t) => !t.minimized).length}
          onNewHourglass={() => {
            setEditingTimer(null);
            setIsModalOpen(true);
          }}
          onShowAll={showAllWindows}
          onHideAll={hideAllWindows}
          onPauseAll={pauseAllTimers}
          onResumeAll={resumeAllTimers}
          onOpenManager={() => setIsManagerOpen(true)}
          onOpenDesktopGuide={() => setIsDesktopGuideOpen(true)}
          backgroundTheme={backgroundTheme}
          onChangeBackgroundTheme={setBackgroundTheme}
        />
      )}
    </div>
  );
}
