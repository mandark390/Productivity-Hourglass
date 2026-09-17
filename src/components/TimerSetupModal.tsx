import React, { useState } from 'react';
import { X, Clock, Calendar, Sparkles, Check } from 'lucide-react';
import { HourglassTimer, TimerType } from '../types';
import { SAND_THEMES } from '../utils/time';

interface TimerSetupModalProps {
  initialTimer?: HourglassTimer | null;
  onSave: (timerData: Partial<HourglassTimer>) => void;
  onClose: () => void;
}

export const TimerSetupModal: React.FC<TimerSetupModalProps> = ({
  initialTimer,
  onSave,
  onClose,
}) => {
  const isEditing = !!initialTimer;
  const [type, setType] = useState<TimerType>(initialTimer?.type || 'task');
  const [name, setName] = useState(initialTimer?.name || (type === 'daily' ? 'Work Day' : 'Focus'));

  // Task duration fields
  const initialMinutes = initialTimer?.durationMs
    ? Math.floor(initialTimer.durationMs / (60 * 1000))
    : 45;
  const [hours, setHours] = useState(Math.floor(initialMinutes / 60));
  const [minutes, setMinutes] = useState(initialMinutes % 60);

  // Daily time fields
  const [startTimeStr, setStartTimeStr] = useState(initialTimer?.startTimeStr || '09:00');
  const [endTimeStr, setEndTimeStr] = useState(initialTimer?.endTimeStr || '18:00');
  const [dailyRepeat, setDailyRepeat] = useState(initialTimer?.dailyRepeat ?? true);
  const [autoStart, setAutoStart] = useState(initialTimer?.autoStart ?? true);

  // Appearance & Behavior
  const [themeId, setThemeId] = useState(initialTimer?.themeId || 'amber');
  const [alwaysOnTop, setAlwaysOnTop] = useState(initialTimer?.alwaysOnTop ?? true);
  const [soundEnabled, setSoundEnabled] = useState(initialTimer?.soundEnabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim() || (type === 'daily' ? 'Daily Time' : 'Task');
    const durationMs = Math.max(1000, (hours * 60 + minutes) * 60 * 1000);

    const payload: Partial<HourglassTimer> = {
      name: cleanName,
      type,
      durationMs: type === 'task' ? durationMs : 0,
      startTimeStr: type === 'daily' ? startTimeStr : undefined,
      endTimeStr: type === 'daily' ? endTimeStr : undefined,
      dailyRepeat: type === 'daily' ? dailyRepeat : false,
      autoStart,
      alwaysOnTop,
      soundEnabled,
      themeId,
      // If editing, preserve geometry; if creating new, default size
      ...(!isEditing && {
        size: { width: 180, height: 300 },
        accumulatedElapsedMs: 0,
        startedAt: Date.now(),
        isPaused: false,
        zIndex: 100,
      }),
    };

    onSave(payload);
  };

  const applyPreset = (h: number, m: number, presetName: string) => {
    setHours(h);
    setMinutes(m);
    if (!isEditing) setName(presetName);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              {isEditing ? 'Edit Hourglass' : 'New Hourglass'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Timer Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setType('task');
                  if (!isEditing && name === 'Work Day') setName('Focus');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  type === 'task'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Task Countdown
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('daily');
                  if (!isEditing && name === 'Focus') setName('Work Day');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  type === 'daily'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Daily Time
              </button>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Hourglass Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'daily' ? 'e.g. Work Day, Study Block' : 'e.g. Writing, Coding, Deep Work'}
              maxLength={24}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* TASK COUNTDOWN SETTINGS */}
          {type === 'task' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Duration
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '15m', h: 0, m: 15, name: 'Quick Sprint' },
                  { label: '25m', h: 0, m: 25, name: 'Pomodoro' },
                  { label: '45m', h: 0, m: 45, name: 'Writing' },
                  { label: '1h', h: 1, m: 0, name: 'Focus Hour' },
                  { label: '2h', h: 2, m: 0, name: 'Deep Work' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.h, preset.m, preset.name)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700/50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Hours & Minutes Input */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1">Hours</span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DAILY TIME SETTINGS */}
          {type === 'daily' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyRepeat}
                    onChange={(e) => setDailyRepeat(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-950"
                  />
                  <span>Repeat automatically every day</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-950"
                  />
                  <span>Automatically count when time arrives</span>
                </label>
              </div>
            </div>
          )}

          {/* SAND COLOR THEMES */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Sand Color
            </label>
            <div className="flex items-center gap-2.5">
              {SAND_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeId(theme.id)}
                  title={theme.name}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    themeId === theme.id
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: theme.sandPrimary }}
                >
                  {themeId === theme.id && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* BEHAVIOR TOGGLES */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={alwaysOnTop}
                onChange={(e) => setAlwaysOnTop(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-950"
              />
              <span>Always on Top (Keep floating above other windows)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-950"
              />
              <span>Play subtle chime when sand finishes</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isEditing ? 'Save Changes' : 'Create Hourglass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
