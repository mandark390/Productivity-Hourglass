import React from 'react';
import ReactDOM from 'react-dom/client';
import { HourglassTimer } from '../types';
import { HourglassGraphic } from '../components/HourglassGraphic';
import { calculateTimerState, getTheme } from './time';

interface DocumentPiPWindow extends Window {
  document: Document;
}

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options: { width: number; height: number }) => Promise<DocumentPiPWindow>;
      window: DocumentPiPWindow | null;
    };
  }
}

export interface PiPResult {
  success: boolean;
  reason?: 'iframe' | 'unsupported' | 'error';
  errorMessage?: string;
}

export function isInsideIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

export function isPiPSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

export async function openHourglassInDesktopPiP(
  timer: HourglassTimer,
  onUpdate: (partial: Partial<HourglassTimer>) => void
): Promise<PiPResult> {
  // Check if running inside iframe (which browser security blocks from PiP requestWindow)
  if (isInsideIframe()) {
    return { success: false, reason: 'iframe' };
  }

  if (!isPiPSupported() || !window.documentPictureInPicture) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const width = Math.max(160, Math.min(360, timer.size.width));
    const height = Math.max(260, Math.min(520, timer.size.height + 40));

    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width,
      height,
    });

    // Copy all style sheets into the PiP window so styling is identical
    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        const cssRules = Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('');
        const style = pipWindow.document.createElement('style');
        style.textContent = cssRules;
        pipWindow.document.head.appendChild(style);
      } catch {
        if (styleSheet.href) {
          const link = pipWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = styleSheet.href;
          pipWindow.document.head.appendChild(link);
        }
      }
    });

    // Set title and window styling
    pipWindow.document.title = `${timer.name} - Hourglass`;
    pipWindow.document.body.style.margin = '0';
    pipWindow.document.body.style.padding = '0';
    pipWindow.document.body.style.backgroundColor = '#0b0f19';
    pipWindow.document.body.style.overflow = 'hidden';
    pipWindow.document.body.style.userSelect = 'none';

    // Mount container
    const container = pipWindow.document.createElement('div');
    container.id = 'pip-hourglass-root';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.position = 'relative';
    pipWindow.document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);

    // Inner PiP Component that updates in real time
    const PiPContent: React.FC = () => {
      const [timerState, setTimerState] = React.useState(() => calculateTimerState(timer));
      const [currentTimer, setCurrentTimer] = React.useState(timer);

      React.useEffect(() => {
        const interval = setInterval(() => {
          setTimerState(calculateTimerState(currentTimer, Date.now()));
        }, 100);
        return () => clearInterval(interval);
      }, [currentTimer]);

      const theme = getTheme(currentTimer.themeId);

      const togglePause = () => {
        if (currentTimer.type === 'daily') {
          const updated = { isPaused: !currentTimer.isPaused };
          setCurrentTimer((prev) => ({ ...prev, ...updated }));
          onUpdate(updated);
          return;
        }

        const now = Date.now();
        if (!currentTimer.isPaused) {
          const elapsed = (currentTimer.accumulatedElapsedMs || 0) + (currentTimer.startedAt ? now - currentTimer.startedAt : 0);
          const updated = { isPaused: true, accumulatedElapsedMs: elapsed, startedAt: null };
          setCurrentTimer((prev) => ({ ...prev, ...updated }));
          onUpdate(updated);
        } else {
          const updated = { isPaused: false, startedAt: now };
          setCurrentTimer((prev) => ({ ...prev, ...updated }));
          onUpdate(updated);
        }
      };

      return (
        <div
          onClick={togglePause}
          title="Click to Pause / Resume"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '12px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HourglassGraphic
              remainingRatio={timerState.remainingRatio}
              progress={timerState.progress}
              status={timerState.status}
              theme={theme}
            />
          </div>
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.05em' }}>
              {currentTimer.name}
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}>
              {timerState.formattedRemaining}
            </div>
          </div>
        </div>
      );
    };

    root.render(<PiPContent />);

    pipWindow.addEventListener('pagehide', () => {
      root.unmount();
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('top-level browsing context')) {
      return { success: false, reason: 'iframe', errorMessage: errorMsg };
    }
    return { success: false, reason: 'error', errorMessage: errorMsg };
  }
}
