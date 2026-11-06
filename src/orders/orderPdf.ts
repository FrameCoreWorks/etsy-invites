import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from 'pdf-lib';

const INK = rgb(0.24, 0.29, 0.23);
const PROMISE = 'You will receive a watermarked proof within 48 hours (24 hours with express).';

/** The one-page PDF the buyer downloads from Etsy: what happens next and the link to the order form. */
export async function orderPdf(slug: string, formUrl: string): Promise<Uint8Array> {
  if (!formUrl.startsWith('https://')) throw new Error('form link must be https');
  const doc = await PDFDocument.create();
  doc.setTitle('Your video invitation: next steps');
  doc.setSubject(PROMISE);
  doc.setAuthor('FrameCore Works');
  const page = doc.addPage([595, 842]); // A4
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  let y = 740;
  const line = (text: string, size = 13, font = serif, gap = 22) => {
    page.drawText(text, { x: 72, y, size, font, color: INK });
    y -= gap;
  };
  line('Thank you for your order!', 26, bold, 48);
  line('Here is how your personalized video invitation is made:', 14, serif, 34);
  line('1. Open the form below and enter your details.', 13);
  line('    Please use your Etsy order number, digits only.', 11, serif, 26);
  line(`2. ${PROMISE}`, 13, serif, 26);
  line('3. Reply in Etsy messages with any changes, or approve the proof.', 13, serif, 26);
  line('4. You receive the final video (1080 x 1920, MP4) as a download link.', 13, serif, 48);

  const label = 'Open the order form';
  const w = bold.widthOfTextAtSize(label, 18);
  page.drawRectangle({ x: 72, y: y - 14, width: w + 40, height: 44, color: rgb(0.54, 0.6, 0.36) });
  page.drawText(label, { x: 92, y: y, size: 18, font: bold, color: rgb(1, 1, 1) });
  const link = doc.context.register(
    doc.context.obj({
      Type: 'Annot', Subtype: 'Link', Rect: [72, y - 14, 72 + w + 40, y + 30], Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(formUrl) },
    }),
  );
  page.node.set(PDFName.of('Annots'), doc.context.obj([link]));
  y -= 60;
  line(formUrl, 9, serif, 40);
  line(`Design: ${slug}`, 10);
  line('Questions? Send me a message on Etsy. Kamil, FrameCore Works', 10);
  return doc.save({ useObjectStreams: false });
}
