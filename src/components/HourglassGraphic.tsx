import React, { useId } from 'react';
import { SandTheme, TimerStatus } from '../types';

interface HourglassGraphicProps {
  remainingRatio: number; // 1 = 100% full top, 0 = empty top
  progress: number;       // 0 = 0% in bottom, 1 = 100% in bottom
  status: TimerStatus;
  theme: SandTheme;
  width?: number;
  height?: number;
}

export const HourglassGraphic: React.FC<HourglassGraphicProps> = ({
  remainingRatio,
  progress,
  status,
  theme,
}) => {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '_');
  const isRunning = status === 'running' && remainingRatio > 0;
  const isFinished = status === 'finished' || remainingRatio <= 0;
  const isPaused = status === 'paused';

  // SVG coordinate system: 200 x 320
  // Top Cap: y: 12 to 24
  // Upper Bulb: y: 24 to 154
  // Neck: y: 154 to 166 (width ~ 14, x: 93 to 107)
  // Lower Bulb: y: 166 to 296
  // Bottom Cap: y: 296 to 308

  // Upper Sand Level Calculation:
  // Bulb spans y: 28 (highest full) to 154 (neck)
  // When ratio = 1, top level is y = 30
  // When ratio = 0, top level is y = 154
  const upperEmptyHeight = (1 - Math.min(1, Math.max(0, remainingRatio))) * (154 - 30);
  const upperSandTopY = 30 + upperEmptyHeight;

  // Lower Sand Level Calculation:
  // Bulb spans y: 166 (neck) to 292 (lowest base)
  // When progress = 0, level is y = 292
  // When progress = 1, level is y = 168
  const lowerFillHeight = Math.min(1, Math.max(0, progress)) * (292 - 168);
  const lowerSandTopY = 292 - lowerFillHeight;

  // Heap peak height in lower chamber when running (sand forms a mound under stream)
  const heapPeakOffset = isRunning && progress < 0.95 ? Math.min(16, 4 + progress * 14) : (isFinished ? 6 : 2);

  return (
    <svg
      viewBox="0 0 200 320"
      className="w-full h-full drop-shadow-md select-none overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Glow and Shading Gradients */}
        <linearGradient id={`sandGrad_${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.sandParticle} />
          <stop offset="45%" stopColor={theme.sandPrimary} />
          <stop offset="100%" stopColor={theme.sandSecondary} />
        </linearGradient>

        <linearGradient id={`glassGrad_${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
        </linearGradient>

        <linearGradient id={`pedimentGrad_${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="25%" stopColor="#334155" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="75%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id={`goldRingGrad_${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="30%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#fde68a" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Inner Chamber Clipping Path */}
        <clipPath id={`upperChamberClip_${safeId}`}>
          {/* Symmetrical upper bulb interior */}
          <path
            d="M 38 28
               C 38 78, 86 130, 93 154
               L 107 154
               C 114 130, 162 78, 162 28
               Z"
          />
        </clipPath>

        <clipPath id={`lowerChamberClip_${safeId}`}>
          {/* Symmetrical lower bulb interior */}
          <path
            d="M 93 166
               C 86 190, 38 242, 38 292
               L 162 292
               C 162 242, 114 190, 107 166
               Z"
          />
        </clipPath>

        {/* Filter for subtle glow */}
        <filter id={`sandGlow_${safeId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Glass Background Silhouette */}
      <path
        d="M 36 26
           C 36 80, 84 132, 92 156
           L 92 164
           C 84 188, 36 240, 36 294
           L 164 294
           C 164 240, 116 188, 108 164
           L 108 156
           C 116 132, 164 80, 164 26
           Z"
        fill="rgba(15, 23, 42, 0.2)"
        stroke={theme.glassBorder}
        strokeWidth="1.2"
      />

      {/* UPPER BULB SAND */}
      <g clipPath={`url(#upperChamberClip_${safeId})`}>
        {remainingRatio > 0.001 && (
          <g>
            {/* Sand body in upper bulb */}
            <path
              d={`M 20 ${upperSandTopY}
                  Q 100 ${isRunning ? upperSandTopY + 7 : upperSandTopY} 180 ${upperSandTopY}
                  L 180 160
                  L 20 160
                  Z`}
              fill={`url(#sandGrad_${safeId})`}
            />

            {/* Subtle animated surface granules if running */}
            {isRunning && (
              <ellipse
                cx="100"
                cy={upperSandTopY + 2}
                rx={Math.max(6, (1 - (upperSandTopY - 30) / 124) * 48)}
                ry="3"
                fill={theme.sandParticle}
                opacity="0.45"
              />
            )}
          </g>
        )}
      </g>

      {/* LOWER BULB SAND */}
      <g clipPath={`url(#lowerChamberClip_${safeId})`}>
        {progress > 0.001 && (
          <g>
            {/* Granular mound / cone of accumulated sand */}
            <path
              d={`M 20 300
                  L 20 ${Math.min(292, lowerSandTopY + 5)}
                  Q 60 ${lowerSandTopY} 100 ${Math.max(168, lowerSandTopY - heapPeakOffset)}
                  Q 140 ${lowerSandTopY} 180 ${Math.min(292, lowerSandTopY + 5)}
                  L 180 300
                  Z`}
              fill={`url(#sandGrad_${safeId})`}
            />

            {/* Gentle highlight at top of sand mound */}
            <ellipse
              cx="100"
              cy={Math.max(172, lowerSandTopY - heapPeakOffset + 2)}
              rx={Math.min(22, 6 + progress * 20)}
              ry="3"
              fill={theme.sandParticle}
              opacity="0.6"
            />
          </g>
        )}
      </g>

      {/* FALLING SAND STREAM & PARTICLES THROUGH CENTER NECK */}
      {isRunning && (
        <g>
          {/* Main falling thread */}
          <line
            x1="100"
            y1="152"
            x2="100"
            y2={Math.max(170, lowerSandTopY - heapPeakOffset + 1)}
            stroke={theme.sandParticle}
            strokeWidth="2.2"
            strokeLinecap="round"
            className="animate-pulse"
          />

          {/* Secondary shimmer thread */}
          <line
            x1="99.5"
            y1="154"
            x2="100.5"
            y2={Math.max(170, lowerSandTopY - heapPeakOffset)}
            stroke={theme.sandPrimary}
            strokeWidth="1.2"
            strokeDasharray="4 2"
            style={{
              animation: 'dashFlow 0.3s linear infinite',
            }}
          />

          {/* Impact splash particles at mound apex */}
          <circle
            cx="98"
            cy={Math.max(170, lowerSandTopY - heapPeakOffset)}
            r="1.2"
            fill={theme.sandParticle}
            className="animate-ping"
            style={{ animationDuration: '0.4s' }}
          />
          <circle
            cx="102"
            cy={Math.max(170, lowerSandTopY - heapPeakOffset + 1)}
            r="1"
            fill={theme.sandParticle}
            className="animate-ping"
            style={{ animationDuration: '0.5s' }}
          />
        </g>
      )}

      {/* GLASS SHADING, REFLECTIONS & SPECULAR HIGHLIGHTS */}
      {/* Glass Bulb Fill Overlay */}
      <path
        d="M 36 26
           C 36 80, 84 132, 92 156
           L 92 164
           C 84 188, 36 240, 36 294
           L 164 294
           C 164 240, 116 188, 108 164
           L 108 156
           C 116 132, 164 80, 164 26
           Z"
        fill={`url(#glassGrad_${safeId})`}
        pointerEvents="none"
      />

      {/* Left Glass Specular Highlight Curve */}
      <path
        d="M 44 38
           C 43 78, 76 118, 86 142"
        fill="none"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pointerEvents="none"
      />
      <path
        d="M 44 282
           C 43 242, 76 202, 86 178"
        fill="none"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        pointerEvents="none"
      />

      {/* Right Soft Specular Highlight Curve */}
      <path
        d="M 156 42
           C 157 74, 132 110, 116 136"
        fill="none"
        stroke="rgba(255, 255, 255, 0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
        pointerEvents="none"
      />
      <path
        d="M 156 278
           C 157 246, 132 210, 116 184"
        fill="none"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1.5"
        strokeLinecap="round"
        pointerEvents="none"
      />

      {/* Center Neck Collar Rings */}
      <g>
        <ellipse cx="100" cy="156" rx="9" ry="2.5" fill={`url(#goldRingGrad_${safeId})`} />
        <ellipse cx="100" cy="164" rx="9" ry="2.5" fill={`url(#goldRingGrad_${safeId})`} />
        {/* Subtle glass waist ring */}
        <line x1="93" y1="160" x2="107" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      </g>

      {/* TOP PEDIMENT / END CAP */}
      <g>
        {/* Main plate */}
        <rect
          x="26"
          y="14"
          width="148"
          height="12"
          rx="4"
          fill={`url(#pedimentGrad_${safeId})`}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        {/* Brass accent trim */}
        <line x1="28" y1="24" x2="172" y2="24" stroke={`url(#goldRingGrad_${safeId})`} strokeWidth="1.5" />
        <line x1="32" y1="16" x2="168" y2="16" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      </g>

      {/* BOTTOM PEDIMENT / END CAP */}
      <g>
        {/* Brass accent trim */}
        <line x1="28" y1="296" x2="172" y2="296" stroke={`url(#goldRingGrad_${safeId})`} strokeWidth="1.5" />
        {/* Main plate */}
        <rect
          x="26"
          y="294"
          width="148"
          height="12"
          rx="4"
          fill={`url(#pedimentGrad_${safeId})`}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        <line x1="32" y1="304" x2="168" y2="304" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
      </g>

      {/* STATUS OVERLAYS (PAUSED / TIME'S UP) */}
      {isPaused && (
        <g>
          <rect
            x="54"
            y="146"
            width="92"
            height="28"
            rx="6"
            fill="rgba(15, 23, 42, 0.85)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1"
          />
          <text
            x="100"
            y="164"
            fill="#e2e8f0"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="1.5"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            PAUSED
          </text>
        </g>
      )}

      {isFinished && (
        <g className="animate-pulse">
          <rect
            x="48"
            y="76"
            width="104"
            height="32"
            rx="8"
            fill="rgba(15, 23, 42, 0.9)"
            stroke={theme.sandPrimary}
            strokeWidth="1.5"
          />
          <text
            x="100"
            y="96"
            fill={theme.sandParticle}
            fontSize="11"
            fontWeight="bold"
            letterSpacing="1.5"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            TIME&apos;S UP
          </text>
        </g>
      )}

      <style>{`
        @keyframes dashFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 12; }
        }
      `}</style>
    </svg>
  );
};
