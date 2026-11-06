export type ListingDraft = {
  slug: string;
  title: string;
  tags: string[];
  description: string;
  priceEur: 35;
  taxonomyId: number;
  video: string;
  images: string[];
  files: string[];
  /** true when any artwork came from AI tools (CREATION.md); then the disclosure is required. */
  usesAi: boolean;
};

/** Fixed lines every description must contain (Etsy Creativity Standards; spec section 5). */
export const AI_DISCLOSURE =
  'About the artwork: the background art was created with the help of AI image tools, then selected, edited and animated by hand by me in my studio.';
export const PERSONALIZATION_LINE =
  'After purchase, fill in the short form linked in your download and you will receive a watermarked proof within 48 hours.';

export function checkListing(d: ListingDraft): string[] {
  const errors: string[] = [];
  if (d.title.length > 140) errors.push(`title is ${d.title.length} characters, max 140`);
  if (d.tags.length !== 13) errors.push(`need exactly 13 tags, got ${d.tags.length}`);
  for (const t of d.tags) if (t.length > 20) errors.push(`tag "${t}" is over 20 characters`);
  const lower = d.tags.map((t) => t.toLowerCase().trim());
  if (new Set(lower).size !== lower.length) errors.push('duplicate tags');
  if (d.usesAi && !d.description.includes(AI_DISCLOSURE)) errors.push('description lacks the AI disclosure');
  if (!d.description.includes(PERSONALIZATION_LINE)) errors.push('description lacks the personalization line');
  if (d.priceEur !== 35) errors.push('price must be 35 EUR');
  if (!d.video) errors.push('listing video missing');
  if (d.images.length < 5 || d.images.length > 10) errors.push(`need 5 to 10 images, got ${d.images.length}`);
  if (!d.files.length) errors.push('digital file (next steps PDF) missing');
  return errors;
}
