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

  return executeSql(sql);
}

function executeSql(sql: string): Promise<string> {
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
