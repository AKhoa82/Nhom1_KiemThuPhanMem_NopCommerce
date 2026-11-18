import { spawn } from 'node:child_process';
import { runtimeConfig } from './runtime-config';

/**
 * Read-only SQL snapshot for the local Cart fixtures.
 * The helper intentionally uses only the configured local Docker target.
 */
export async function queryCartFixtureState(): Promise<string> {
  if (!runtimeConfig.sqlPassword) {
    throw new Error('FIXTURE_BLOCKED: QA_SQL_PASSWORD is required for Cart SQL evidence.');
  }

  const sql = `
SET NOCOUNT ON;
SELECT CONCAT('PRODUCT|', p.Sku, '|', p.StockQuantity)
FROM Product p
WHERE p.Sku IN ('PW-SIMPLE-001', 'PW-SHIRT', 'PW-OOS-001') AND p.Deleted = 0;

SELECT CONCAT('VARIANT|', p.Sku, '|', pac.StockQuantity, '|', pac.AttributesXml)
FROM ProductAttributeCombination pac
INNER JOIN Product p ON p.Id = pac.ProductId
WHERE p.Sku = 'PW-SHIRT';

SELECT CONCAT('DISCOUNT|', d.CouponCode, '|', CONVERT(varchar(32), d.DiscountPercentage), '|', CONVERT(varchar(8), d.IsActive))
FROM Discount d
WHERE d.CouponCode = 'PW-CART-10PCT';

SELECT CONCAT('CART|', p.Sku, '|', sci.Quantity, '|', sci.AttributesXml)
FROM ShoppingCartItem sci
INNER JOIN Product p ON p.Id = sci.ProductId
WHERE sci.ShoppingCartTypeId = 1
  AND p.Sku IN ('PW-SIMPLE-001', 'PW-SHIRT', 'PW-OOS-001');

SELECT CONCAT('COUPON|', ga.Value)
FROM GenericAttribute ga
WHERE ga.KeyGroup = 'Customer'
  AND ga.[Key] = 'DiscountCouponCode'
  AND ga.Value LIKE '%PW-CART-10PCT%';
`;

  return executeReadonlySql(sql);
}

/**
 * Read-only checkout snapshot keyed by the synthetic checkout email.
 * The output deliberately excludes the email itself and any address text so
 * that the attachment contains only identifiers, counts and test state.
 */
export async function queryCheckoutEvidence(customerEmail: string): Promise<string> {
  if (!runtimeConfig.sqlPassword) {
    throw new Error('FIXTURE_BLOCKED: QA_SQL_PASSWORD is required for checkout SQL evidence.');
  }

  const escapedEmail = customerEmail.replaceAll("'", "''");
  const sql = `
SET NOCOUNT ON;
DECLARE @Email nvarchar(255) = N'${escapedEmail}';
DECLARE @CustomerId int = (
  SELECT TOP 1 Id FROM Customer WHERE Email = @Email AND Deleted = 0 ORDER BY Id DESC
);

SELECT CONCAT('CUSTOMER_ID|', COALESCE(CONVERT(varchar(32), @CustomerId), '-'));

SELECT CONCAT('ORDER_COUNT|', COUNT_BIG(1))
FROM [Order] o
LEFT JOIN Address ba ON ba.Id = o.BillingAddressId
WHERE o.Deleted = 0
  AND (@CustomerId IS NOT NULL AND o.CustomerId = @CustomerId
       OR ba.Email = @Email);

SELECT CONCAT(
  'ORDER|', o.Id, '|', o.OrderStatusId, '|', o.PaymentStatusId, '|',
  COALESCE(o.PaymentMethodSystemName, '-'), '|',
  CONVERT(varchar(64), o.OrderTotal)
)
FROM [Order] o
LEFT JOIN Address ba ON ba.Id = o.BillingAddressId
WHERE o.Deleted = 0
  AND (@CustomerId IS NOT NULL AND o.CustomerId = @CustomerId
       OR ba.Email = @Email)
ORDER BY o.Id;

SELECT CONCAT('CART_COUNT|', COUNT_BIG(1))
FROM ShoppingCartItem sci
WHERE sci.ShoppingCartTypeId = 1
  AND @CustomerId IS NOT NULL
  AND sci.CustomerId = @CustomerId;

SELECT CONCAT('CART|', p.Sku, '|', sci.Quantity, '|',
              REPLACE(REPLACE(COALESCE(sci.AttributesXml, ''), CHAR(13), ' '), CHAR(10), ' '))
FROM ShoppingCartItem sci
INNER JOIN Product p ON p.Id = sci.ProductId
WHERE sci.ShoppingCartTypeId = 1
  AND @CustomerId IS NOT NULL
  AND sci.CustomerId = @CustomerId
ORDER BY sci.Id;

SELECT CONCAT('PRODUCT|', p.Sku, '|', p.StockQuantity)
FROM Product p
WHERE p.Sku IN ('PW-SIMPLE-001', 'PW-SHIRT', 'PW-OOS-001') AND p.Deleted = 0;

SELECT CONCAT('VARIANT|', p.Sku, '|', pac.StockQuantity, '|',
              REPLACE(REPLACE(COALESCE(pac.AttributesXml, ''), CHAR(13), ' '), CHAR(10), ' '))
FROM ProductAttributeCombination pac
INNER JOIN Product p ON p.Id = pac.ProductId
WHERE p.Sku = 'PW-SHIRT'
ORDER BY pac.Id;

SELECT CONCAT('ATTR|', ga.[Key], '|',
              REPLACE(REPLACE(COALESCE(ga.Value, ''), CHAR(13), ' '), CHAR(10), ' '))
FROM GenericAttribute ga
WHERE ga.KeyGroup = 'Customer'
  AND @CustomerId IS NOT NULL
  AND ga.EntityId = @CustomerId
  AND ga.[Key] IN ('SelectedShippingOption', 'SelectedPaymentMethod', 'CheckoutAttributes');
`;

  return executeReadonlySql(sql);
}

export function executeReadonlySql(sql: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('docker.exe', [
      'exec', '-i', runtimeConfig.databaseContainer,
      '/opt/mssql-tools18/bin/sqlcmd',
      '-C', '-S', 'localhost', '-U', 'sa', '-P', runtimeConfig.sqlPassword,
      '-d', runtimeConfig.databaseName, '-b', '-h', '-1', '-W', '-s', '|',
    ], { windowsHide: true });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(`SQL fixture query failed (${code}): ${stderr || stdout}`.trim()));
        return;
      }
      resolve(stdout.replace(/\r/g, '').trim());
    });
    child.stdin.end(sql);
  });
}
