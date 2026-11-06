import type React from 'react';
import { Composition as WeddingBotanicalStd } from '../../templates/wedding-botanical-std/src/Composition';
import weddingBotanicalStd from '../../templates/wedding-botanical-std/template.json';

export type RegistryEntry = { component: React.FC<any>; durationSec: number };

/** Every template with engine "remotion" must be listed here (checked in tests/render/registry.test.ts). */
export const registry: Record<string, RegistryEntry> = {
  'wedding-botanical-std': { component: WeddingBotanicalStd, durationSec: weddingBotanicalStd.durationSec },
};
