import { continueRender, delayRender, staticFile } from 'remotion';

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

const FACES: Array<[family: string, file: string, weight: string, range: string]> = [];
for (const w of ['400', '500', '600']) {
  FACES.push(['Cormorant Garamond', `cormorant-garamond-latin-${w}-normal.woff2`, w, LATIN]);
  FACES.push(['Cormorant Garamond', `cormorant-garamond-latin-ext-${w}-normal.woff2`, w, LATIN_EXT]);
}
FACES.push(['Great Vibes', 'great-vibes-latin-400-normal.woff2', '400', LATIN]);
FACES.push(['Great Vibes', 'great-vibes-latin-ext-400-normal.woff2', '400', LATIN_EXT]);

let loaded: Promise<void> | null = null;

/** Loads all bundled fonts once; render waits until they are ready. */
export function loadFonts(): void {
  if (loaded || typeof FontFace === "undefined") return;
  const handle = delayRender('fonts');
  loaded = Promise.all(
    FACES.map(async ([family, file, weight, unicodeRange]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight, unicodeRange });
      await face.load();
      document.fonts.add(face);
    }),
  ).then(() => continueRender(handle));
}

export const SERIF = '"Cormorant Garamond", serif';
export const SCRIPT = '"Great Vibes", cursive';
