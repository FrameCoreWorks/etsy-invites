import type React from 'react';
import { Composition as WeddingBotanicalStd } from '../../templates/wedding-botanical-std/src/Composition';
import weddingBotanicalStd from '../../templates/wedding-botanical-std/template.json';
import { Composition as WeddingBotanicalInv } from '../../templates/wedding-botanical-inv/src/Composition';
import weddingBotanicalInv from '../../templates/wedding-botanical-inv/template.json';

export type RegistryEntry = { component: React.FC<any>; durationSec: number };

/** Every template with engine "remotion" must be listed here (checked in tests/render/registry.test.ts). */
export const registry: Record<string, RegistryEntry> = {
  'wedding-botanical-std': { component: WeddingBotanicalStd, durationSec: weddingBotanicalStd.durationSec },
  'wedding-botanical-inv': { component: WeddingBotanicalInv, durationSec: weddingBotanicalInv.durationSec },
};
