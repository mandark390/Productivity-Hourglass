import { HourglassTimer } from '../types';

const STORAGE_KEY = 'hourglass_app_timers_v1';

export const DEFAULT_TIMERS: HourglassTimer[] = [
  {
    id: 'timer-workday',
    name: 'Day',
    type: 'daily',
    startTimeStr: '09:00',
    endTimeStr: '23:00',
    durationMs: 14 * 60 * 60 * 1000,
    accumulatedElapsedMs: 0,
    startedAt: Date.now(),
    dailyRepeat: true,
    autoStart: true,
    isPaused: false,
    soundEnabled: true,
    alwaysOnTop: true,
    themeId: 'amber',
    position: { x: 48, y: 72 },
    size: { width: 190, height: 320 },
    zIndex: 10,
    createdAt: Date.now(),
  },
  {
    id: 'timer-writing',
    name: 'Writing',
    type: 'task',
    durationMs: 45 * 60 * 1000, // 45 minutes
    accumulatedElapsedMs: 0,
    startedAt: Date.now(),
    dailyRepeat: false,
    autoStart: true,
    isPaused: false,
    soundEnabled: true,
    alwaysOnTop: true,
    themeId: 'gold',
    position: { x: 280, y: 72 },
    size: { width: 170, height: 280 },
    zIndex: 11,
    createdAt: Date.now() + 1,
  },
];

export function loadTimersFromStorage(): HourglassTimer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTimersToStorage(DEFAULT_TIMERS);
      return DEFAULT_TIMERS;
    }
    const parsed = JSON.parse(raw) as HourglassTimer[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_TIMERS;
  } catch (err) {
    console.warn('Failed to load timers from localStorage:', err);
    return DEFAULT_TIMERS;
  }
}

export function saveTimersToStorage(timers: HourglassTimer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch (err) {
    console.warn('Failed to save timers to localStorage:', err);
  }
}
