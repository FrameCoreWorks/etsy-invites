import { describe, it, expect } from 'vitest';
import { checkListing, AI_DISCLOSURE, PERSONALIZATION_LINE, type ListingDraft } from '../../src/listing/check';

const ok: ListingDraft = {
  slug: 'wedding-botanical-std',
  title: 'Botanical Save the Date Video, Personalized Wedding Announcement, Greenery Animated Evite for Text',
  tags: ['save the date video', 'wedding evite', 'greenery save date', 'botanical wedding', 'animated invite', 'digital save date', 'video invitation', 'text message invite', 'eucalyptus wedding', 'sage green wedding', 'custom save the date', 'wedding announcement', 'phone invitation'],
  description: `Hello!\n\n${PERSONALIZATION_LINE}\n\n${AI_DISCLOSURE}`,
  priceEur: 35,
  taxonomyId: 1,
  video: 'v.mp4',
  images: ['1.png', '2.png', '3.png', '4.png', '5.png'],
  files: ['next-steps.pdf'],
  usesAi: true,
};

describe('checkListing', () => {
  it('accepts a valid draft', () => expect(checkListing(ok)).toEqual([]));
  it('rejects a title over 140 characters', () => expect(checkListing({ ...ok, title: 'x'.repeat(141) })).toHaveLength(1));
  it('requires exactly 13 tags', () => {
    expect(checkListing({ ...ok, tags: [...ok.tags, 'extra tag'] }).join()).toMatch(/13/);
    expect(checkListing({ ...ok, tags: ok.tags.slice(1) }).join()).toMatch(/13/);
  });
  it('rejects tags over 20 characters and duplicates', () => {
    expect(checkListing({ ...ok, tags: [...ok.tags.slice(1), 'this tag is too long!'] }).join()).toMatch(/20/);
    expect(checkListing({ ...ok, tags: [...ok.tags.slice(1), 'Wedding Evite'] }).join()).toMatch(/duplicate/i);
  });
  it('requires the AI disclosure and personalization line in the description', () => {
    expect(checkListing({ ...ok, description: 'Hello' })).toHaveLength(2);
  });
  it('does not require the AI disclosure for hand-made artwork', () => {
    expect(checkListing({ ...ok, usesAi: false, description: PERSONALIZATION_LINE })).toEqual([]);
  });
  it('requires the price of 35 EUR, a video, 5 to 10 images and the PDF', () => {
    expect(checkListing({ ...ok, priceEur: 30 as 35 }).join()).toMatch(/35/);
    expect(checkListing({ ...ok, video: '' }).join()).toMatch(/video/);
    expect(checkListing({ ...ok, images: ['1.png'] }).join()).toMatch(/images/);
    expect(checkListing({ ...ok, files: [] }).join()).toMatch(/file/);
  });
});
