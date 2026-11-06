import type { Format } from '../../src/template/schema';
export const FPS = 30;
export function dimensions(format: Format): { width: number; height: number } {
  return format === '16x9' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
}
