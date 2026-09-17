import { HourglassTimer, CalculatedTimerState, SandTheme } from '../types';

export const SAND_THEMES: SandTheme[] = [
  {
    id: 'amber',
    name: 'Warm Amber',
    sandPrimary: '#f59e0b',    // amber-500
    sandSecondary: '#d97706',  // amber-600
    sandParticle: '#fbbf24',   // amber-400
    sandGlow: 'rgba(245, 158, 11, 0.35)',
    glassBorder: 'rgba(251, 191, 36, 0.45)',
    glassShine: 'rgba(255, 255, 255, 0.28)',
  },
  {
    id: 'gold',
    name: 'Golden Sand',
    sandPrimary: '#eab308',    // yellow-500
    sandSecondary: '#ca8a04',  // yellow-600
    sandParticle: '#fef08a',   // yellow-200
    sandGlow: 'rgba(234, 179, 8, 0.35)',
    glassBorder: 'rgba(250, 204, 21, 0.45)',
    glassShine: 'rgba(255, 255, 255, 0.3)',
  },
  {
    id: 'coral',
    name: 'Coral Glow',
    sandPrimary: '#f43f5e',    // rose-500
    sandSecondary: '#e11d48',  // rose-600
    sandParticle: '#fda4af',   // rose-300
    sandGlow: 'rgba(244, 63, 94, 0.35)',
    glassBorder: 'rgba(251, 113, 133, 0.45)',
    glassShine: 'rgba(255, 255, 255, 0.28)',
  },
  {
    id: 'emerald',
    name: 'Emerald Zen',
    sandPrimary: '#10b981',    // emerald-500
    sandSecondary: '#059669',  // emerald-600
    sandParticle: '#6ee7b7',   // emerald-300
    sandGlow: 'rgba(16, 185, 129, 0.35)',
    glassBorder: 'rgba(52, 211, 153, 0.45)',
    glassShine: 'rgba(255, 255, 255, 0.28)',
  },
  {
    id: 'azure',
    name: 'Celestial Azure',
    sandPrimary: '#38bdf8',    // sky-400
    sandSecondary: '#0284c7',  // sky-600
    sandParticle: '#bae6fd',   // sky-200
    sandGlow: 'rgba(56, 189, 248, 0.35)',
    glassBorder: 'rgba(125, 211, 252, 0.45)',
    glassShine: 'rgba(255, 255, 255, 0.28)',
  },
];

export function getTheme(themeId?: string): SandTheme {
  const found = SAND_THEMES.find((t) => t.id === themeId);
  return found || SAND_THEMES[0];
}

/**
 * Format milliseconds into a clean, human-readable string:
 * e.g. "37:24", "1h 45m", "08s"
 */
export function formatDurationMs(ms: number, forceHours = false): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0 || forceHours) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Short duration for badges, e.g. "45m", "2h 15m"
 */
export function formatDurationShort(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format 24h string "09:00" to "9:00 AM"
 */
export function formatTime12h(time24?: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Calculate timestamps for a daily time window
 */
export function getDailyTimestamps(
  startTimeStr: string = '09:00',
  endTimeStr: string = '17:00',
  referenceDate = new Date()
): { startMs: number; endMs: number; totalMs: number } {
  const [startH, startM] = startTimeStr.split(':').map((v) => parseInt(v, 10));
  const [endH, endM] = endTimeStr.split(':').map((v) => parseInt(v, 10));

  const start = new Date(referenceDate);
  start.setHours(startH, startM, 0, 0);

  const end = new Date(referenceDate);
  end.setHours(endH, endM, 0, 0);

  // If end time is earlier than start time (e.g. 10 PM to 6 AM overnight)
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  const startMs = start.getTime();
  const endMs = end.getTime();
  const totalMs = Math.max(1000, endMs - startMs);

  return { startMs, endMs, totalMs };
}

/**
 * Accurately calculate timer state using timestamps.
 * Immune to frame drops, CPU throttles, and computer sleep.
 */
export function calculateTimerState(
  timer: HourglassTimer,
  nowMs: number = Date.now()
): CalculatedTimerState {
  if (timer.type === 'daily') {
    const startStr = timer.startTimeStr || '09:00';
    const endStr = timer.endTimeStr || '17:00';
    const { startMs, endMs, totalMs } = getDailyTimestamps(startStr, endStr, new Date(nowMs));

    if (nowMs < startMs) {
      // Not yet started
      const untilStart = startMs - nowMs;
      return {
        status: 'upcoming',
        remainingMs: totalMs,
        elapsedMs: 0,
        totalMs,
        progress: 0,
        remainingRatio: 1,
        formattedRemaining: formatDurationShort(totalMs),
        subtitle: `Starts at ${formatTime12h(startStr)} (in ${formatDurationShort(untilStart)})`,
      };
    }

    if (nowMs >= endMs) {
      // Completed for today
      return {
        status: 'finished',
        remainingMs: 0,
        elapsedMs: totalMs,
        totalMs,
        progress: 1,
        remainingRatio: 0,
        formattedRemaining: "TIME'S UP",
        subtitle: `Ended at ${formatTime12h(endStr)}`,
      };
    }

    // Currently running within the active window
    const elapsedMs = nowMs - startMs;
    const remainingMs = Math.max(0, endMs - nowMs);
    const progress = Math.min(1, Math.max(0, elapsedMs / totalMs));
    const remainingRatio = 1 - progress;

    return {
      status: timer.isPaused ? 'paused' : 'running',
      remainingMs,
      elapsedMs,
      totalMs,
      progress,
      remainingRatio,
      formattedRemaining: formatDurationMs(remainingMs, true),
      subtitle: `${formatTime12h(startStr)} → ${formatTime12h(endStr)}`,
    };
  }

  // --- Task Countdown Mode ---
  const totalMs = Math.max(1000, timer.durationMs);
  let elapsedMs = timer.accumulatedElapsedMs || 0;

  if (!timer.isPaused && timer.startedAt) {
    elapsedMs += Math.max(0, nowMs - timer.startedAt);
  }

  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const progress = Math.min(1, Math.max(0, elapsedMs / totalMs));
  const remainingRatio = 1 - progress;

  let status: 'running' | 'paused' | 'finished' = 'running';
  if (remainingMs <= 0) {
    status = 'finished';
  } else if (timer.isPaused) {
    status = 'paused';
  }

  return {
    status,
    remainingMs,
    elapsedMs,
    totalMs,
    progress,
    remainingRatio,
    formattedRemaining: status === 'finished' ? "TIME'S UP" : formatDurationMs(remainingMs),
    subtitle: `${formatDurationShort(totalMs)} task`,
  };
}
