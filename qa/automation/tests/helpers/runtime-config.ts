import type { PairwiseCase } from './pairwise-data';

const value = (name: string, fallback = '') => process.env[name]?.trim() || fallback;

export const runtimeConfig = {
  registeredEmail: value('QA_REGISTERED_EMAIL'),
  registeredPassword: value('QA_REGISTERED_PASSWORD'),
  simpleProductPath: value('QA_SIMPLE_PRODUCT_PATH', '/pw-simple-stock'),
  configurableProductPath: value('QA_CONFIGURABLE_PRODUCT_PATH', '/pw-shirt-variants'),
  outOfStockProductPath: value('QA_OUT_OF_STOCK_PRODUCT_PATH', '/pw-out-of-stock'),
  sqlPassword: value('QA_SQL_PASSWORD'),
  databaseContainer: value('QA_DB_CONTAINER', 'nopcommerce_mssql_server'),
  databaseName: value('QA_DB_NAME', 'nopcommerce'),
  storeContainer: value('QA_STORE_CONTAINER', 'nopcommerce_qa'),
  billing: {
    firstName: value('QA_BILLING_FIRST_NAME', 'QA'),
    lastName: value('QA_BILLING_LAST_NAME', 'Customer'),
    email: value('QA_BILLING_EMAIL'),
    city: value('QA_BILLING_CITY', 'Ho Chi Minh City'),
    address1: value('QA_BILLING_ADDRESS1', '1 Test Street'),
    zip: value('QA_BILLING_ZIP', '700000'),
    phone: value('QA_BILLING_PHONE', '0900000000'),
    country: value('QA_BILLING_COUNTRY', 'Vietnam'),
    state: value('QA_BILLING_STATE', 'Hồ Chí Minh'),
  },
};

export function blockedReason(row: PairwiseCase): string | undefined {
  const missing: string[] = [];
  if (!runtimeConfig.sqlPassword) missing.push('QA_SQL_PASSWORD (local fixture reset)');
  if (row.customerType === 'Registered' && !runtimeConfig.registeredEmail) missing.push('QA_REGISTERED_EMAIL');
  if (row.customerType === 'Registered' && !runtimeConfig.registeredPassword) missing.push('QA_REGISTERED_PASSWORD');
  if (row.address !== 'NA') {
    const requiredBillingValues: Array<[string, string]> = [
      ['QA_BILLING_FIRST_NAME', runtimeConfig.billing.firstName],
      ['QA_BILLING_LAST_NAME', runtimeConfig.billing.lastName],
      ['QA_BILLING_EMAIL', runtimeConfig.billing.email],
      ['QA_BILLING_CITY', runtimeConfig.billing.city],
      ['QA_BILLING_ADDRESS1', runtimeConfig.billing.address1],
      ['QA_BILLING_ZIP', runtimeConfig.billing.zip],
      ['QA_BILLING_PHONE', runtimeConfig.billing.phone],
      ['QA_BILLING_COUNTRY', runtimeConfig.billing.country],
      ['QA_BILLING_STATE', runtimeConfig.billing.state],
    ];
    missing.push(...requiredBillingValues.filter(([, value]) => !value).map(([name]) => name));
  }
  return missing.length ? `Blocked: environment/fixture is not configured: ${missing.join(', ')}.` : undefined;
}
