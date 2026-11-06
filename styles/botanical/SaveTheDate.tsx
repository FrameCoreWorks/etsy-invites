import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { loadFonts, SERIF, SCRIPT } from '../shared/fonts';
import { formatDateLong } from '../shared/format';
import { botanical } from './palette';
import { Branch } from './Branch';

export type SaveTheDateProps = { names: string; date: string; city: string; message?: string; accent?: string };

loadFonts();

const fade = (frame: number, start: number, fps: number) =>
  interpolate(frame, [start, start + 0.8 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const BotanicalSaveTheDate: React.FC<SaveTheDateProps> = ({ names, date, city, message, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const textWidth = width * (portrait ? 0.78 : 0.6);
  const leaf = accent || botanical.sage;
  const namesSize = Math.min(portrait ? 150 : 130, fitText({ text: names, withinWidth: textWidth, fontFamily: SCRIPT }).fontSize);
  const lift = (start: number) => ({ opacity: fade(frame, start, fps), transform: `translateY(${(1 - fade(frame, start, fps)) * 30}px)` });
  const u = Math.min(width, height) / 1080;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${botanical.paper} 55%, ${botanical.paperEdge} 100%)` }}>
      <Branch x={width * 0.02} y={height * 0.32} rotate={-10} scale={u * 1.1} color={leaf} />
      <Branch x={width * 1.0} y={height * 1.04} rotate={30} scale={u * 0.85} delay={12} color={leaf} mirror />
      <Branch x={width * 0.05} y={height * 1.02} rotate={-35} scale={u * 0.8} delay={24} color={leaf} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: botanical.ink, padding: `0 ${(width - textWidth) / 2}px` }}>
        <div style={{ fontFamily: SERIF, fontSize: 54 * u, letterSpacing: 14 * u, textTransform: 'uppercase', fontWeight: 500, ...lift(1.0 * fps) }}>Save the date</div>
        <div style={{ height: 2, width: 220 * u, background: botanical.gold, margin: `${36 * u}px 0`, opacity: fade(frame, 1.6 * fps, fps) }} />
        <div style={{ fontFamily: SCRIPT, fontSize: namesSize, lineHeight: 1.25, whiteSpace: 'nowrap', ...lift(2.2 * fps) }}>{names}</div>
        <div style={{ fontFamily: SERIF, fontSize: 64 * u, fontWeight: 600, marginTop: 40 * u, ...lift(3.6 * fps) }}>{formatDateLong(date)}</div>
        <div style={{ fontFamily: SERIF, fontSize: 46 * u, letterSpacing: 6 * u, textTransform: 'uppercase', marginTop: 18 * u, ...lift(4.4 * fps) }}>{city}</div>
        {message ? (
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 40 * u, marginTop: 56 * u, ...lift(5.4 * fps) }}>{message}</div>
        ) : null}
        <div style={{ fontFamily: SERIF, fontSize: 30 * u, letterSpacing: 4 * u, textTransform: 'uppercase', marginTop: 70 * u, opacity: 0.7 * fade(frame, 6.2 * fps, fps) }}>Invitation to follow</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
