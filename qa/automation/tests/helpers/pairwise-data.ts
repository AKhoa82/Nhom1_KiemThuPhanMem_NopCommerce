import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const expectedCaseIds = Array.from({ length: 14 }, (_, index) =>
  `PW-${String(index + 1).padStart(3, '0')}`,
);

const generatedColumns = [
  'CaseId', 'CustomerType', 'ProductType', 'CartComposition', 'QuantityClass',
  'InventoryState', 'Coupon', 'Address', 'ShippingMethod', 'PaymentMethod', 'CartAction',
] as const;

const mappingColumns = ['CaseId', 'ScenarioId', 'Reason', 'ExpectedPath', 'MappingStatus', 'Notes'] as const;

export type CustomerType = 'Registered' | 'Guest';
export type ProductType = 'SimplePhysical' | 'ConfigurablePhysical';
export type CartComposition = 'OneLine' | 'MultipleLines';
export type QuantityClass = 'One' | 'ManyWithinStock' | 'AtAvailableLimit' | 'ExceedsAvailableStock';
export type InventoryState = 'InStock' | 'OutOfStock';
export type Coupon = 'None' | 'Valid' | 'Invalid';
export type Address = 'Complete' | 'MissingRequired' | 'NA';
export type ShippingMethod = 'LocalOption1' | 'NA';
export type PaymentMethod = 'LocalSuccess' | 'NA';
export type CartAction = 'Add' | 'Update' | 'Remove';
export type ExpectedPath = 'Positive' | 'Negative' | 'Boundary';

export interface GeneratedCase {
  caseId: string;
  customerType: CustomerType;
  productType: ProductType;
  cartComposition: CartComposition;
  quantityClass: QuantityClass;
  inventoryState: InventoryState;
  coupon: Coupon;
  address: Address;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  cartAction: CartAction;
}

export interface PairwiseCase extends GeneratedCase {
  scenarioId: string;
  reason: string;
  expectedPath: ExpectedPath;
  notes: string;
}

type CsvRecord = Record<string, string>;

function parseCsv(text: string, source: string): CsvRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error(`${source}: unterminated quoted CSV field.`);
  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (rows.length < 2) throw new Error(`${source}: expected a header and at least one data row.`);

  const [headers, ...dataRows] = rows;
  if (new Set(headers).size !== headers.length) throw new Error(`${source}: duplicate CSV header.`);

  return dataRows.map((cells, rowIndex) => {
    if (cells.length !== headers.length) {
      throw new Error(`${source}: row ${rowIndex + 2} has ${cells.length} columns; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]));
  });
}

function requireColumns(records: CsvRecord[], columns: readonly string[], source: string): void {
  const headers = Object.keys(records[0] ?? {});
  const missing = columns.filter((column) => !headers.includes(column));
  if (missing.length > 0) throw new Error(`${source}: missing required column(s): ${missing.join(', ')}.`);
}

function requireValue<T extends string>(value: string, allowed: readonly T[], name: string, caseId: string): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`${caseId}: invalid ${name} value "${value}". Allowed: ${allowed.join(', ')}.`);
  }
  return value as T;
}

function validateExpectedIds(caseIds: string[], source: string): void {
  if (caseIds.length !== expectedCaseIds.length) {
    throw new Error(`${source}: expected ${expectedCaseIds.length} rows but found ${caseIds.length}.`);
  }
  if (new Set(caseIds).size !== caseIds.length) throw new Error(`${source}: CaseId values must be unique.`);
  const unexpected = caseIds.filter((caseId) => !expectedCaseIds.includes(caseId));
  const missing = expectedCaseIds.filter((caseId) => !caseIds.includes(caseId));
  if (unexpected.length || missing.length) {
    throw new Error(`${source}: CaseId set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
  }
}

function toGeneratedCase(record: CsvRecord): GeneratedCase {
  const caseId = record.CaseId;
  if (!/^PW-\d{3}$/.test(caseId)) throw new Error(`Invalid CaseId "${caseId}".`);

  return {
    caseId,
    customerType: requireValue(record.CustomerType, ['Registered', 'Guest'], 'CustomerType', caseId),
    productType: requireValue(record.ProductType, ['SimplePhysical', 'ConfigurablePhysical'], 'ProductType', caseId),
    cartComposition: requireValue(record.CartComposition, ['OneLine', 'MultipleLines'], 'CartComposition', caseId),
    quantityClass: requireValue(record.QuantityClass, ['One', 'ManyWithinStock', 'AtAvailableLimit', 'ExceedsAvailableStock'], 'QuantityClass', caseId),
    inventoryState: requireValue(record.InventoryState, ['InStock', 'OutOfStock'], 'InventoryState', caseId),
    coupon: requireValue(record.Coupon, ['None', 'Valid', 'Invalid'], 'Coupon', caseId),
    address: requireValue(record.Address, ['Complete', 'MissingRequired', 'NA'], 'Address', caseId),
    shippingMethod: requireValue(record.ShippingMethod, ['LocalOption1', 'NA'], 'ShippingMethod', caseId),
    paymentMethod: requireValue(record.PaymentMethod, ['LocalSuccess', 'NA'], 'PaymentMethod', caseId),
    cartAction: requireValue(record.CartAction, ['Add', 'Update', 'Remove'], 'CartAction', caseId),
  };
}

export function loadPairwiseCases(repositoryRoot = resolve(__dirname, '../../../..')): PairwiseCase[] {
  const generatedPath = resolve(repositoryRoot, 'qa/pairwise/test-data/generated-cases.csv');
  const mappingPath = resolve(repositoryRoot, 'qa/pairwise/test-data/scenario-mapping.csv');
  const generated = parseCsv(readFileSync(generatedPath, 'utf8'), generatedPath);
  const mappings = parseCsv(readFileSync(mappingPath, 'utf8'), mappingPath);
  requireColumns(generated, generatedColumns, generatedPath);
  requireColumns(mappings, mappingColumns, mappingPath);

  const cases = generated.map(toGeneratedCase);
  validateExpectedIds(cases.map((item) => item.caseId), generatedPath);
  validateExpectedIds(mappings.map((item) => item.CaseId), mappingPath);

  const mappingsById = new Map(mappings.map((mapping) => [mapping.CaseId, mapping]));
  return cases.map((item) => {
    const mapping = mappingsById.get(item.caseId);
    if (!mapping) throw new Error(`${item.caseId}: no scenario mapping found.`);
    if (mapping.MappingStatus !== 'Mapped') throw new Error(`${item.caseId}: MappingStatus must be Mapped.`);
    if (!mapping.ScenarioId || !mapping.Reason || !mapping.Notes) throw new Error(`${item.caseId}: mapping has an empty required value.`);
    return {
      ...item,
      scenarioId: mapping.ScenarioId,
      reason: mapping.Reason,
      expectedPath: requireValue(mapping.ExpectedPath, ['Positive', 'Negative', 'Boundary'], 'ExpectedPath', item.caseId),
      notes: mapping.Notes,
    };
  });
}
