/** Usage: npx tsx scripts/new-template.ts <slug> <style> remotion|hyperframes std|inv */
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { TEMPLATES_ROOT, type Field, type TemplateManifest } from '../src/template/schema';

export type Kind = 'std' | 'inv';

const accent: Field = { key: 'accent', label: 'Accent color (optional)', type: 'color', required: false, example: '#8a9a5b' };
export const FIELD_SETS: Record<Kind, Field[]> = {
  std: [
    { key: 'names', label: 'Couple names', type: 'text', maxLength: 40, required: true, example: 'Emma & Liam' },
    { key: 'date', label: 'Wedding date', type: 'date', required: true, example: '2027-06-12' },
    { key: 'city', label: 'City', type: 'text', maxLength: 40, required: true, example: 'Charleston, SC' },
    { key: 'message', label: 'Short message (optional)', type: 'text', maxLength: 60, required: false, example: "We can't wait to celebrate with you" },
    accent,
  ],
  inv: [
    { key: 'names', label: 'Couple names', type: 'text', maxLength: 40, required: true, example: 'Emma & Liam' },
    { key: 'date', label: 'Wedding date', type: 'date', required: true, example: '2027-06-12' },
    { key: 'time', label: 'Ceremony time', type: 'text', maxLength: 10, required: true, example: '4:30 PM' },
    { key: 'venue', label: 'Venue name', type: 'text', maxLength: 50, required: true, example: 'Magnolia Plantation' },
    { key: 'address', label: 'Venue address', type: 'text', maxLength: 80, required: true, example: '3550 Ashley River Rd, Charleston, SC' },
    { key: 'rsvp', label: 'RSVP line', type: 'text', maxLength: 80, required: true, example: 'RSVP by May 1 at emmaandliam.com' },
    accent,
  ],
};
const DURATION: Record<Kind, number> = { std: 15, inv: 25 };
const COMPONENT: Record<Kind, string> = { std: 'SaveTheDate', inv: 'Invitation' };

const creationMd = (slug: string, style: string, kind: Kind) => `# ${slug}: dokumentacja wkładu twórczego

## Brief
Styl \`${style}\`, ${kind === 'std' ? 'save the date' : 'zaproszenie'}, ${DURATION[kind]} s, 9:16 (opcjonalnie 16:9).

## Prompty
(prompty do grafik i ich wersje, z datą)

## Decyzje człowieka
(co Kamil wybrał, odrzucił i poprawił ręcznie, z datą)

## Koszt fal
(liczba obrazów i koszt w USD)
`;

export async function scaffoldTemplate(slug: string, style: string, engine: TemplateManifest['engine'], kind: Kind, root = TEMPLATES_ROOT): Promise<string> {
  const dir = path.join(root, slug);
  if (await access(dir).then(() => true, () => false)) throw new Error(`${slug} already exists`);
  await mkdir(path.join(dir, 'src'), { recursive: true });
  const manifest: TemplateManifest = { slug, engine, durationSec: DURATION[kind], formats: ['9x16', '16x9'], fields: FIELD_SETS[kind] };
  await writeFile(path.join(dir, 'template.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(path.join(dir, 'CREATION.md'), creationMd(slug, style, kind));
  if (engine === 'remotion') {
    await writeFile(
      path.join(dir, 'src/Composition.tsx'),
      `import { ${COMPONENT[kind]} } from '../../../styles/${style}/${COMPONENT[kind]}';\nexport const Composition = ${COMPONENT[kind]};\n`,
    );
  } else {
    await writeFile(path.join(dir, 'src/index.html'), `<!-- HyperFrames composition for ${slug}; fields are injected as variables (see render/hyperframes). -->\n`);
  }
  return dir;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, style, engine, kind] = process.argv.slice(2);
  const dir = await scaffoldTemplate(slug, style, engine as TemplateManifest['engine'], kind as Kind);
  console.log(`created ${dir}`);
  if (engine === 'remotion') console.log(`add ${slug} to render/remotion/registry.ts (tests/render/registry.test.ts checks it)`);
}
