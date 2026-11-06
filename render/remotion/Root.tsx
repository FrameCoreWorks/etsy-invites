import React from 'react';
import { Composition } from 'remotion';
import { registry } from './registry';
import { dimensions, FPS } from './dimensions';
import { Mockup } from './Mockup';

export const Root: React.FC = () => (
  <>
    {Object.entries(registry).map(([slug, entry]) => (
      <Composition
        key={slug}
        id={slug}
        component={entry.component}
        fps={FPS}
        durationInFrames={Math.round(entry.durationSec * FPS)}
        width={1080}
        height={1920}
        defaultProps={{} as Record<string, string>}
        calculateMetadata={({ props }) => dimensions(((props as any).__format ?? '9x16'))}
      />
    ))}
    <Composition id="listing-mockup" component={Mockup} fps={FPS} durationInFrames={1} width={2000} height={2000} defaultProps={{ kind: 'steps' as const }} />
  </>
);
