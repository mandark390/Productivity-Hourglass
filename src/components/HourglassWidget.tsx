import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  X,
  Volume2,
  VolumeX,
  Pin,
  PinOff,
  Maximize2,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { HourglassTimer, CalculatedTimerState } from '../types';
import { HourglassGraphic } from './HourglassGraphic';
import { calculateTimerState, getTheme, SAND_THEMES } from '../utils/time';
import { playCompletionChime, playClickSound } from '../utils/audio';
import { openHourglassInDesktopPiP } from '../utils/pip';

interface HourglassWidgetProps {
  timer: HourglassTimer;
  onUpdate: (updated: Partial<HourglassTimer>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onBringToFront: () => void;
  onRequestPiP?: (timer: HourglassTimer) => void;
  isElectron?: boolean;
}

export const HourglassWidget: React.FC<HourglassWidgetProps> = ({
  timer,
  onUpdate,
  onDelete,
  onEdit,
  onBringToFront,
  onRequestPiP,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [timerState, setTimerState] = useState<CalculatedTimerState>(() =>
    calculateTimerState(timer)
  );
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Sound chime tracking so we don't ring repeatedly on every tick
  const chimePlayedRef = useRef(false);

  // Dragging and resizing refs
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, startW: 0, startH: 0 });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Continuous accurate calculation via system clock (every 100ms for buttery sand flow)
  useEffect(() => {
    const update = () => {
      const state = calculateTimerState(timer, Date.now());
      setTimerState(state);

      if (state.status === 'finished') {
        if (!chimePlayedRef.current && timer.soundEnabled) {
          playCompletionChime();
          chimePlayedRef.current = true;
          onUpdate({ lastCompletedAt: Date.now() });
        }
      } else {
        chimePlayedRef.current = false;
      }
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [timer, onUpdate]);

  // Handle Pause / Resume toggle
  const handleTogglePause = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      playClickSound();

      if (timer.type === 'daily') {
        onUpdate({ isPaused: !timer.isPaused });
        return;
      }

      // Task mode
      const now = Date.now();
      if (!timer.isPaused) {
        // Pausing
        const currentElapsed = (timer.accumulatedElapsedMs || 0) + (timer.startedAt ? now - timer.startedAt : 0);
        onUpdate({
          isPaused: true,
          accumulatedElapsedMs: currentElapsed,
          startedAt: null,
        });
      } else {
        // Resuming
        onUpdate({
          isPaused: false,
          startedAt: now,
        });
      }
    },
    [timer, onUpdate]
  );

  // Handle Restart
  const handleRestart = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      playClickSound();
      chimePlayedRef.current = false;

      if (timer.type === 'daily') {
        onUpdate({ isPaused: false });
        return;
      }

      onUpdate({
        accumulatedElapsedMs: 0,
        startedAt: Date.now(),
        isPaused: false,
      });
    },
    [timer, onUpdate]
  );

  // --- DRAGGING LOGIC (Drag anywhere directly on the hourglass) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    onBringToFront();
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - timer.position.x,
      y: e.clientY - timer.position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - timer.size.width, moveEvent.clientX - dragOffsetRef.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - timer.size.height, moveEvent.clientY - dragOffsetRef.current.y));
      onUpdate({ position: { x: Math.round(newX), y: Math.round(newY) } });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // --- RESIZING LOGIC (Corner Handle maintaining aspect ratio) ---
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onBringToFront();
    isResizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: timer.size.width,
      startH: timer.size.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;
      const newH = Math.max(120, Math.min(720, resizeStartRef.current.startH + deltaY));
      const aspect = 200 / 320; // 0.625
      const newW = Math.round(newH * aspect);

      onUpdate({ size: { width: newW, height: Math.round(newH) } });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const theme = getTheme(timer.themeId);
  const isSmall = timer.size.height < 180;
  const isMedium = timer.size.height >= 180 && timer.size.height < 340;

  return (
    <div
      ref={widgetRef}
      id={`hourglass-widget-${timer.id}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleTogglePause}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowColorPicker(false);
      }}
      style={{
        transform: `translate(${timer.position.x}px, ${timer.position.y}px)`,
        width: `${timer.size.width}px`,
        height: `${timer.size.height}px`,
        zIndex: timer.alwaysOnTop ? 9999 + timer.zIndex : timer.zIndex,
      }}
      className="absolute top-0 left-0 flex flex-col items-center justify-center select-none cursor-grab active:cursor-grabbing group bg-transparent border-0 shadow-none ring-0 outline-none"
    >
      {/* FLOATING HOVER MICRO-CONTROL PILL (Floats above top cap on hover with NO surrounding box) */}
      <div
        className={`absolute -top-9 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/15 shadow-xl transition-all duration-200 pointer-events-auto ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Pause / Resume */}
        <button
          title={timer.isPaused ? 'Resume timer' : 'Pause timer'}
          onClick={handleTogglePause}
          className={`p-1 rounded-full text-white transition-transform active:scale-90 ${
            timer.isPaused ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {timer.isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
        </button>

        {/* Restart */}
        <button
          title="Restart timer"
          onClick={handleRestart}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Always on top toggle */}
        <button
          title={timer.alwaysOnTop ? 'Always on Top: ON' : 'Always on Top: OFF'}
          onClick={() => onUpdate({ alwaysOnTop: !timer.alwaysOnTop })}
          className={`p-1 rounded-full transition-colors ${
            timer.alwaysOnTop ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {timer.alwaysOnTop ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
        </button>

        {/* Sound toggle */}
        <button
          title={timer.soundEnabled ? 'Chime Sound ON' : 'Chime Sound OFF'}
          onClick={() => onUpdate({ soundEnabled: !timer.soundEnabled })}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {timer.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
        </button>

        {/* Sand color palette */}
        <button
          title="Sand Color"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Palette className="w-3 h-3" />
        </button>

        {/* Edit timer */}
        <button
          title="Edit timer settings"
          onClick={onEdit}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Settings2 className="w-3 h-3" />
        </button>

        {/* Pop Out to Desktop (Outside App Window) */}
        <button
          title="Pop Out to Desktop: Float outside browser anywhere on your screen"
          onClick={async () => {
            if (onRequestPiP) {
              onRequestPiP(timer);
            } else {
              await openHourglassInDesktopPiP(timer, onUpdate);
            }
          }}
          className="p-1 rounded-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </button>

        {/* Close hourglass */}
        <button
          title="Close hourglass"
          onClick={onDelete}
          className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* COLOR PICKER FLOATING POPUP */}
      {showColorPicker && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 p-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {SAND_THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => {
                onUpdate({ themeId: th.id });
                setShowColorPicker(false);
              }}
              title={th.name}
              className={`w-4 h-4 rounded-full border transition-transform ${
                timer.themeId === th.id ? 'scale-125 border-white ring-1 ring-white/50' : 'border-transparent opacity-75 hover:opacity-100'
              }`}
              style={{ backgroundColor: th.sandPrimary }}
            />
          ))}
        </div>
      )}

      {/* PURE HOURGLASS GRAPHIC */}
      <div className="w-full h-full relative flex items-center justify-center">
        <HourglassGraphic
          remainingRatio={timerState.remainingRatio}
          progress={timerState.progress}
          status={timerState.status}
          theme={theme}
        />

        {/* SUBTLE ETCHED TIMER LABEL & REMAINING TIME (Floating cleanly beneath bottom cap) */}
        <div
          className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center justify-center text-center pointer-events-none transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-85'
          }`}
        >
          <span
            className={`font-semibold tracking-wider text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
              isSmall ? 'text-[10px]' : isMedium ? 'text-xs' : 'text-sm'
            }`}
          >
            {timer.name}
          </span>
          <span
            className={`font-mono font-medium tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
              timerState.status === 'finished'
                ? 'text-amber-400 font-bold'
                : timerState.status === 'paused'
                ? 'text-slate-400'
                : 'text-amber-300/90'
            } ${isSmall ? 'text-[10px]' : isMedium ? 'text-xs' : 'text-sm'}`}
          >
            {timerState.formattedRemaining}
          </span>
        </div>

        {/* CORNER RESIZE HANDLE (Near bottom-right corner of bottom pediment, visible on hover) */}
        <div
          onMouseDown={handleResizeStart}
          title="Drag to resize hourglass"
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-400 hover:text-amber-400 transition-opacity z-20 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Maximize2 className="w-2.5 h-2.5 rotate-90" />
        </div>
      </div>
    </div>
  );
};
