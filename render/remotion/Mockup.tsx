import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { loadFonts, SERIF, SCRIPT } from '../../styles/shared/fonts';

loadFonts();

export type MockupProps = { kind: 'hero' | 'steps' | 'options'; frame?: string; headline?: string };

const PAPER = '#f4efe6';
const INK = '#33402f';
const ACCENT = '#8a9a5b';

const Phone: React.FC<{ src: string; height: number }> = ({ src, height }) => {
  const width = (height * 9) / 16;
  return (
    <div style={{ width: width + 48, height: height + 48, borderRadius: 90, background: '#1d1d1f', padding: 24, boxShadow: '0 40px 80px rgba(0,0,0,0.25)' }}>
      <Img src={src} style={{ width, height, borderRadius: 66, display: 'block' }} />
    </div>
  );
};

const STEPS = [
  ['Purchase', 'Add any extras you like: express, 16:9 version, illustration.'],
  ['Fill in the form', 'The link is in your download. Names, date, place.'],
  ['Get your proof', 'A watermarked preview within 48 hours. Request changes.'],
  ['Share it', 'Receive the final MP4 and send it by text, WhatsApp or email.'],
];
const OPTIONS = [
  ['Personalized video, 9:16', '35 €'],
  ['Express proof in 24 h', '+15 €'],
  ['Extra 16:9 version', '+10 €'],
  ['Custom illustration', '+25 €'],
];

export const Mockup: React.FC<MockupProps> = ({ kind, frame, headline }) => (
  <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: SERIF, alignItems: 'center', justifyContent: 'center' }}>
    {kind === 'hero' && frame ? (
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 120 }}>
        <Phone src={frame} height={1600} />
        <div style={{ width: 700 }}>
          <div style={{ fontFamily: SCRIPT, fontSize: 150, lineHeight: 1.1 }}>{headline ?? 'Video Save the Date'}</div>
          <div style={{ fontSize: 64, marginTop: 40 }}>Personalized with your names, date and place</div>
          <div style={{ fontSize: 52, marginTop: 60, color: ACCENT, letterSpacing: 6, textTransform: 'uppercase' }}>Send by text or email</div>
        </div>
      </AbsoluteFill>
    ) : null}
    {kind === 'steps' ? (
      <div style={{ width: 1600 }}>
        <div style={{ fontFamily: SCRIPT, fontSize: 160, textAlign: 'center', marginBottom: 80 }}>How it works</div>
        {STEPS.map(([t, d], i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 60, marginBottom: 70 }}>
            <div style={{ width: 150, height: 150, borderRadius: 75, background: ACCENT, color: 'white', fontSize: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 80, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 56 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    ) : null}
    {kind === 'options' ? (
      <div style={{ width: 1500 }}>
        <div style={{ fontFamily: SCRIPT, fontSize: 160, textAlign: 'center', marginBottom: 100 }}>Options</div>
        {OPTIONS.map(([t, p]) => (
          <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 76, borderBottom: `3px solid ${ACCENT}`, padding: '40px 0' }}>
            <span>{t}</span>
            <span style={{ fontWeight: 600 }}>{p}</span>
          </div>
        ))}
      </div>
    ) : null}
  </AbsoluteFill>
);
