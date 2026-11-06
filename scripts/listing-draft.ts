/**
 * Usage: npx tsx scripts/listing-draft.ts <slug>            builds media into listings/<slug>/media and checks listing.json
 *        npx tsx scripts/listing-draft.ts <slug> --upload   also creates an Etsy DRAFT (never active)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { listingVideo, mockups } from '../src/listing/media';
import { checkListing, type ListingDraft } from '../src/listing/check';
import { orderPdf } from '../src/orders/orderPdf';
import { EtsyClient } from '../src/etsy/client';
import { persistRefreshToken } from '../src/etsy/persistToken';

const [slug] = process.argv.slice(2);
const upload = process.argv.includes('--upload');
const dir = path.resolve(import.meta.dirname, '../listings', slug);
const media = path.join(dir, 'media');
await mkdir(media, { recursive: true });

const copy = JSON.parse(await readFile(path.join(dir, 'listing.json'), 'utf8')) as Pick<ListingDraft, 'title' | 'tags' | 'description' | 'taxonomyId' | 'usesAi'>;
const forms = JSON.parse(await readFile(path.resolve(import.meta.dirname, '../config/forms.json'), 'utf8'));
if (!forms[slug]) throw new Error(`no order form for ${slug}; run scripts/build-form.ts first`);

const video = await listingVideo(slug, media);
const images = await mockups(slug, media);
const pdf = path.join(media, 'Your-video-invitation-next-steps.pdf');
await writeFile(pdf, await orderPdf(slug, forms[slug].responderUri));

const draft: ListingDraft = { slug, priceEur: 35, video, images, files: [pdf], ...copy };
const errors = checkListing(draft);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`media ready in ${media}`);
if (!upload) process.exit(0);

const etsy = EtsyClient.fromEnv((t) => persistRefreshToken(t));
const shopId = Number(process.env.ETSY_SHOP_ID);
const { listing_id } = await etsy.createDraftListing(shopId, {
  title: draft.title, description: draft.description, price: draft.priceEur, quantity: 999, tags: draft.tags,
  who_made: 'i_did', when_made: 'made_to_order', taxonomy_id: draft.taxonomyId, type: 'download',
  is_personalizable: false, should_auto_renew: true,
});
for (const [i, img] of images.entries()) await etsy.uploadListingImage(shopId, listing_id, img, i + 1);
await etsy.uploadListingVideo(shopId, listing_id, video);
await etsy.uploadListingFile(shopId, listing_id, pdf, 'Your video invitation - next steps.pdf');
await writeFile(path.join(dir, 'draft.json'), JSON.stringify({ listing_id, createdAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`draft: https://www.etsy.com/your/shops/me/listing-editor/edit/${listing_id}`);
