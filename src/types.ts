export type TimerType = 'task' | 'daily';

export type TimerStatus = 'running' | 'paused' | 'finished' | 'upcoming';

export interface SandTheme {
  id: string;
  name: string;
  sandPrimary: string;
  sandSecondary: string;
  sandParticle: string;
  sandGlow: string;
  glassBorder: string;
  glassShine: string;
}

export interface HourglassTimer {
  id: string;
  name: string;
  type: TimerType;
  
  // For Task Countdown
  durationMs: number;           // Total target duration in ms
  accumulatedElapsedMs: number; // Time elapsed prior to current run
  startedAt: number | null;     // Date.now() when timer was last started/resumed
  
  // For Daily Time
  startTimeStr?: string;        // "HH:mm" 24h format (e.g. "09:00")
  endTimeStr?: string;          // "HH:mm" 24h format (e.g. "17:00" or "23:00")
  dailyRepeat?: boolean;
  autoStart?: boolean;

  // State
  isPaused: boolean;
  soundEnabled: boolean;
  alwaysOnTop: boolean;
  themeId: string;
  frameless?: boolean;
  
  // Floating Window Geometry
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized?: boolean;
  
  // Timestamps for audit
  createdAt: number;
  lastCompletedAt?: number | null;
}

export interface CalculatedTimerState {
  status: TimerStatus;
  remainingMs: number;
  elapsedMs: number;
  totalMs: number;
  progress: number; // 0 to 1 (0 = just started, 1 = completed)
  remainingRatio: number; // 1 to 0 (1 = full top, 0 = empty top)
  formattedRemaining: string;
  subtitle: string;
}
