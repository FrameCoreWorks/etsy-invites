import React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { loadFonts, SERIF, SCRIPT } from '../shared/fonts';
import { formatDateLong } from '../shared/format';
import { botanical } from './palette';
import { Branch } from './Branch';

export type InvitationProps = { names: string; date: string; time: string; venue: string; address: string; rsvp: string; accent?: string };

loadFonts();

/** A scene that fades in, holds and fades out (last scene holds to the end). */
const Scene: React.FC<{ children: React.ReactNode; durationSec: number; last?: boolean }> = ({ children, durationSec, last }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = durationSec * fps;
  const opacity = last
    ? interpolate(frame, [0, 0.8 * fps], [0, 1], { extrapolateRight: 'clamp' })
    : interpolate(frame, [0, 0.8 * fps, end - 0.8 * fps, end], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(frame, [0, 0.8 * fps], [30, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity, transform: `translateY(${y}px)` }}>{children}</AbsoluteFill>;
};

export const BotanicalInvitation: React.FC<InvitationProps> = ({ names, date, time, venue, address, rsvp, accent }) => {
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const u = Math.min(width, height) / 1080;
  const textWidth = width * (portrait ? 0.78 : 0.6);
  const leaf = accent || botanical.sage;
  const namesSize = Math.min(portrait ? 160 : 140, fitText({ text: names, withinWidth: textWidth, fontFamily: SCRIPT }).fontSize);
  const caps: React.CSSProperties = { fontFamily: SERIF, fontSize: 42 * u, letterSpacing: 10 * u, textTransform: 'uppercase', fontWeight: 500 };
  const body: React.CSSProperties = { fontFamily: SERIF, fontSize: 54 * u, lineHeight: 1.35, maxWidth: textWidth };
  const rule = <div style={{ height: 2, width: 220 * u, background: botanical.gold, margin: `${36 * u}px auto` }} />;
  const s = (sec: number) => Math.round(sec * fps);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${botanical.paper} 55%, ${botanical.paperEdge} 100%)`, color: botanical.ink }}>
      <Branch x={width * 0.02} y={height * 0.32} rotate={-10} scale={u * 1.1} color={leaf} />
      <Branch x={width * 1.0} y={height * 1.04} rotate={30} scale={u * 0.85} delay={12} color={leaf} mirror />
      <Branch x={width * 0.05} y={height * 1.02} rotate={-35} scale={u * 0.8} delay={24} color={leaf} />
      <Sequence from={s(0.8)} durationInFrames={s(6.2)}>
        <Scene durationSec={6.2}>
          <div style={caps}>Together with their families</div>
          {rule}
          <div style={{ fontFamily: SCRIPT, fontSize: namesSize, lineHeight: 1.25, whiteSpace: 'nowrap' }}>{names}</div>
          {rule}
          <div style={caps}>request the pleasure of your company</div>
        </Scene>
      </Sequence>
      <Sequence from={s(7)} durationInFrames={s(6)}>
        <Scene durationSec={6}>
          <div style={caps}>at the celebration of their marriage</div>
          {rule}
          <div style={{ fontFamily: SERIF, fontSize: 76 * u, fontWeight: 600 }}>{formatDateLong(date)}</div>
          <div style={{ ...body, marginTop: 20 * u }}>at {time}</div>
        </Scene>
      </Sequence>
      <Sequence from={s(13)} durationInFrames={s(6)}>
        <Scene durationSec={6}>
          <div style={caps}>Venue</div>
          {rule}
          <div style={{ ...body, fontSize: 68 * u, fontWeight: 600 }}>{venue}</div>
          <div style={{ ...body, marginTop: 20 * u }}>{address}</div>
        </Scene>
      </Sequence>
      <Sequence from={s(19)}>
        <Scene durationSec={6} last>
          <div style={{ fontFamily: SCRIPT, fontSize: 120 * u }}>Kindly reply</div>
          {rule}
          <div style={body}>{rsvp}</div>
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
};
