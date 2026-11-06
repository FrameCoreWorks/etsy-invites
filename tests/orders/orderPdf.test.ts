import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { orderPdf } from '../../src/orders/orderPdf';

describe('orderPdf', () => {
  it('is one page with a clickable form link and the 48 h promise', async () => {
    const url = 'https://docs.google.com/forms/d/e/abc123/viewform';
    const bytes = await orderPdf('wedding-botanical-std', url);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const raw = Buffer.from(bytes).toString('latin1');
    expect(raw).toContain(`/URI (${url})`);
    expect(doc.getSubject()).toContain('48 hours');
  });
  it('refuses a non-https link', async () => {
    await expect(orderPdf('x', 'http://example.com')).rejects.toThrow(/https/);
  });
});
