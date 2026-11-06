import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { botanical } from './palette';

type Props = { x: number; y: number; rotate: number; scale?: number; delay?: number; color?: string; mirror?: boolean };

// Vector placeholder for the hand-finished fal artwork (see CREATION.md).
const STEM = 'M0 0 C 60 -120, 140 -220, 260 -300 S 460 -420, 560 -560';
const LEAVES: Array<[number, number, number]> = [
  [70, -110, -30], [130, -190, 40], [200, -250, -20], [280, -310, 55], [350, -360, -10], [430, -430, 60], [500, -490, 0],
];

export const Branch: React.FC<Props> = ({ x, y, rotate, scale = 1, delay = 0, color = botanical.sage, mirror }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = interpolate(frame - delay, [0, 2.2 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const sway = Math.sin((frame + delay) / (fps * 1.6)) * 1.5;
  return (
    <svg
      style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}
      width={1}
      height={1}
    >
      <g transform={`rotate(${rotate + sway}) scale(${mirror ? -scale : scale}, ${scale})`}>
        <path d={STEM} fill="none" stroke={botanical.sageDark} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - grow} />
        {LEAVES.map(([lx, ly, r], i) => {
          const s = spring({ frame: frame - delay - 10 - i * 6, fps, config: { damping: 14 } });
          return (
            <g key={i} transform={`translate(${lx} ${ly}) rotate(${r}) scale(${s})`}>
              <path d="M0 0 C 30 -40, 90 -40, 120 0 C 90 40, 30 40, 0 0 Z" fill={color} opacity={0.85} />
              <path d="M0 0 L 115 0" stroke={botanical.sageDark} strokeWidth={2} opacity={0.5} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};
