import { test, type Page, type TestInfo } from '@playwright/test';
import { cartCase } from './cart-catalog';
import { readCartState } from './assertions';

const failedSteps = new Map<string, string>();
export async function step<T>(name: string, action: () => Promise<T>): Promise<T> {
  return test.step(name, async () => {
    try { return await action(); }
    catch (error) { failedSteps.set(test.info().testId, name); throw error; }
  });
}
export function annotateCase(info: TestInfo, caseId: string): void {
  const item = cartCase(caseId);
  for (const [type, value] of Object.entries({ caseId, precondition: item.precondition, input: item.input,
    expected: item.expected, invariant: item.invariants, 'expected-path': item.path })) {
    info.annotations.push({ type, description: typeof value === 'string' ? value : JSON.stringify(value) });
  }
}

// Diagnostics are best-effort; failures collecting evidence must never replace the test failure.
export async function attachFailureLog(page: Page, info: TestInfo, sql: () => Promise<string>, force = false): Promise<void> {
  try {
    if (!force && (info.status === info.expectedStatus || info.status === 'skipped')) return;
    const caseId = info.annotations.find(a => a.type === 'caseId')?.description;
    if (!caseId) return;
    const capture = async (fn: () => Promise<unknown>) => {
      try { return await fn(); } catch (error) { return { collectionError: String(error) }; }
    };
    const actual = await capture(() => readCartState(page, true));
    const sqlSnapshot = await capture(sql);
    const totalsHtml = await capture(async () => page.locator('.cart-total').evaluateAll(nodes => nodes.map(node => node.outerHTML)));
    await info.attach('failure-log.json', { contentType: 'application/json', body: JSON.stringify({
      ...cartCase(caseId), actual, failedStep: failedSteps.get(info.testId) ?? info.errors[0]?.message,
      url: page.url().replace(/\?.*$/, ''), sqlSnapshot, totalsHtml,
    }, null, 2) });
    await capture(async () => info.attach('failure-cart.png', { contentType: 'image/png', body: await page.screenshot({ fullPage: true, timeout: 5000 }) }));
  } finally { failedSteps.delete(info.testId); }
}
