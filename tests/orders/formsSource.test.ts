import { describe, it, expect } from 'vitest';
import { mapFormResponse } from '../../src/orders/formsSource';

const items = [
  { title: 'Etsy order number [order]', questionItem: { question: { questionId: 'q1' } } },
  { title: 'Wedding date [date]', questionItem: { question: { questionId: 'q2' } } },
  { title: 'I purchased express delivery (24 h) [express]', questionItem: { question: { questionId: 'q3' } } },
  { title: 'A heading without key' },
];

describe('mapFormResponse', () => {
  it('maps answers to field keys by the key in the question title', () => {
    const r = mapFormResponse('wedding-a', items, {
      responseId: 'r1',
      lastSubmittedTime: '2026-11-06T10:00:00Z',
      answers: {
        q1: { questionId: 'q1', textAnswers: { answers: [{ value: ' 3456789012 ' }] } },
        q2: { questionId: 'q2', textAnswers: { answers: [{ value: '2027-06-12' }] } },
        q3: { questionId: 'q3', textAnswers: { answers: [{ value: 'Yes' }] } },
      },
    });
    expect(r).toEqual({ responseId: 'r1', slug: 'wedding-a', submittedAt: '2026-11-06T10:00:00Z', answers: { order: ' 3456789012 ', date: '2027-06-12', express: 'Yes' } });
  });
  it('omits unanswered questions', () => {
    const r = mapFormResponse('wedding-a', items, { responseId: 'r2', lastSubmittedTime: 't', answers: {} });
    expect(r.answers).toEqual({});
  });
});
