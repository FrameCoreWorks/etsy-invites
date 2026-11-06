import type { forms_v1 } from '@googleapis/forms';
import type { FormSpec, FormItem } from './formMap';

function question(i: FormItem): forms_v1.Schema$Item {
  if (i.type === 'checkbox') {
    return { title: i.title, description: i.help, questionItem: { question: { required: false, choiceQuestion: { type: 'CHECKBOX', options: [{ value: 'Yes' }] } } } };
  }
  if (i.type === 'date') {
    return { title: i.title, description: i.help, questionItem: { question: { required: i.required, dateQuestion: { includeYear: true, includeTime: false } } } };
  }
  return { title: i.title, description: i.help, questionItem: { question: { required: i.required, textQuestion: { paragraph: false } } } };
}

/** batchUpdate requests that build the form. Length limits and regexes are re-checked by intake (Forms API has no validation rules). */
export function toBatchRequests(spec: FormSpec): forms_v1.Schema$Request[] {
  return [
    { updateFormInfo: { info: { description: spec.description }, updateMask: 'description' } },
    ...spec.items.map((item, index) => ({ createItem: { item: question(item), location: { index } } })),
  ];
}
