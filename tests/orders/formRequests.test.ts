import { describe, it, expect } from 'vitest';
import { buildFormSpec } from '../../src/orders/formMap';
import { toBatchRequests } from '../../src/orders/formRequests';
import { headerKey } from '../../src/orders/formMap';

const spec = buildFormSpec({
  slug: 'wedding-a', engine: 'remotion', durationSec: 15, formats: ['9x16'],
  fields: [
    { key: 'names', label: 'Couple names', type: 'text', maxLength: 40, required: true, example: 'Emma & Liam' },
    { key: 'date', label: 'Wedding date', type: 'date', required: true, example: '2027-06-12' },
  ],
});

describe('toBatchRequests', () => {
  const reqs = toBatchRequests(spec);
  const items = reqs.filter((r) => r.createItem).map((r) => r.createItem!.item!);
  it('creates one item per question in order, keys recoverable from titles', () => {
    expect(items.map((i) => headerKey(i.title!))).toEqual(spec.items.map((i) => i.key));
    expect(reqs.filter((r) => r.createItem).map((r) => r.createItem!.location!.index)).toEqual(spec.items.map((_, i) => i));
  });
  it('uses a date question for dates and required text for the order number', () => {
    expect(items[2].questionItem!.question!.dateQuestion).toBeDefined();
    expect(items[0].questionItem!.question!.required).toBe(true);
  });
  it('uses single-option checkboxes for extras', () => {
    const express = items.find((i) => headerKey(i.title!) === 'express')!;
    expect(express.questionItem!.question!.choiceQuestion!.options).toEqual([{ value: 'Yes' }]);
  });
});
