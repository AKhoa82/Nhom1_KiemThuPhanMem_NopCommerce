import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface CartLine {
  product: string;
  attributes: string[];
  quantity: number;
  unitPrice: number;
}
export interface CartState {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  warning?: { product: string; pattern: string } | null;
  outcome?: string;
}
export interface CartCase {
  caseId: string;
  group: 'PW' | 'ADV';
  path: string;
  precondition: string;
  input: string;
  expected: CartState;
  invariants: string[];
}
const dataRoot = resolve(__dirname, '../../test-data');
export const cartManifest = JSON.parse(readFileSync(resolve(dataRoot, 'cart-fixture-manifest.json'), 'utf8'));
export const cartCatalog: CartCase[] = JSON.parse(readFileSync(resolve(dataRoot, 'cart-case-catalog.json'), 'utf8'));

export function validateCatalogIds(group: CartCase['group'], expectedIds: string[]): void {
  const ids = cartCatalog.filter(item => item.group === group).map(item => item.caseId);
  if (new Set(ids).size !== ids.length || ids.length !== expectedIds.length ||
      expectedIds.some(id => !ids.includes(id)) || ids.some(id => !expectedIds.includes(id))) {
    throw new Error(`FAILED_AUTOMATION: ${group} catalog IDs differ from generated cases: ${ids.join(', ')}`);
  }
  for (const item of cartCatalog.filter(item => item.group === group)) {
    if (!item.precondition || !item.input || !item.path || !item.invariants.length || !Array.isArray(item.expected.lines)) {
      throw new Error(`FAILED_AUTOMATION: incomplete catalog metadata for ${item.caseId}`);
    }
    const subtotal = item.expected.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    if (subtotal !== item.expected.subtotal || item.expected.discount < 0 ||
        item.expected.discount > subtotal || item.expected.total !== subtotal - item.expected.discount) {
      throw new Error(`FAILED_AUTOMATION: inconsistent monetary oracle for ${item.caseId}`);
    }
  }
}

export function cartCase(caseId: string): CartCase {
  const found = cartCatalog.find(item => item.caseId === caseId);
  if (!found) throw new Error(`FAILED_AUTOMATION: missing cart catalog case ${caseId}`);
  return found;
}
