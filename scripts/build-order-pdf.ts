/** Usage: npx tsx scripts/build-order-pdf.ts <slug>  ->  dist/pdf/<slug>.pdf (link from config/forms.json) */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { orderPdf } from '../src/orders/orderPdf';

const slug = process.argv[2];
const forms = JSON.parse(await readFile(path.resolve(import.meta.dirname, '../config/forms.json'), 'utf8'));
if (!forms[slug]) throw new Error(`no form for ${slug}; run scripts/build-form.ts ${slug} first`);
const out = path.resolve(import.meta.dirname, '../dist/pdf');
await mkdir(out, { recursive: true });
await writeFile(path.join(out, `${slug}.pdf`), await orderPdf(slug, forms[slug].responderUri));
console.log(path.join(out, `${slug}.pdf`));
