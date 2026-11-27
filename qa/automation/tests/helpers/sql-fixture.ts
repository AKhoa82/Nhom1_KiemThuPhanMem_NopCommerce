import { spawn } from 'node:child_process';
import { runtimeConfig } from './runtime-config';

/** N02 evidence is scoped to the two customers and one store in the current run. */
export async function queryN02CartState(guestGuid: string, accountEmail: string, storeId: number): Promise<string> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestGuid)) {
    throw new Error('FIXTURE_BLOCKED: invalid guest GUID for N02 SQL snapshot.');
  }
  if (!Number.isSafeInteger(storeId) || storeId < 1) {
    throw new Error('FIXTURE_BLOCKED: invalid store ID for N02 SQL snapshot.');
  }
  if (accountEmail && !/^qa\.n02\.[a-zA-Z0-9._%+\-]+@example\.test$/.test(accountEmail)) {
    throw new Error('FIXTURE_BLOCKED: N02 account must use a dedicated qa.n02.*@example.test email.');
  }
  const sql = `
SET NOCOUNT ON;
DECLARE @GuestGuid uniqueidentifier = CONVERT(uniqueidentifier, '${guestGuid}');
DECLARE @AccountEmail nvarchar(255) = N'${accountEmail}';
DECLARE @StoreId int = ${storeId};
DECLARE @GuestId int = (SELECT Id FROM Customer WHERE CustomerGuid = @GuestGuid AND Deleted = 0);
DECLARE @AccountId int = (SELECT TOP 1 Id FROM Customer WHERE Email = @AccountEmail AND Deleted = 0 ORDER BY Id DESC);
DECLARE @ProductId int = (SELECT Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);
IF @GuestId IS NULL OR @ProductId IS NULL OR (@AccountEmail <> N'' AND @AccountId IS NULL)
    THROW 51000, 'FIXTURE_BLOCKED: N02 SQL identity or product is missing.', 1;

SELECT CONCAT('N02_PRODUCT|', @ProductId, '|', p.Sku, '|price=', CONVERT(varchar(40), p.Price),
    '|inventory=', p.ManageInventoryMethodId, '|backorder=', p.BackorderModeId, '|taxExempt=', p.IsTaxExempt)
FROM Product p WHERE p.Id = @ProductId;
SELECT CONCAT('N02_VARIANT|', pac.Id, '|stock=', pac.StockQuantity,
    '|allowOutOfStock=', pac.AllowOutOfStockOrders, '|', pac.AttributesXml)
FROM ProductAttributeCombination pac WHERE pac.ProductId = @ProductId ORDER BY pac.Id;
SELECT CONCAT('N02_CUSTOMER|', v.RoleName, '|id=', v.CustomerId, '|store=', @StoreId,
    '|cartRows=', COUNT(sci.Id), '|quantity=', COALESCE(SUM(sci.Quantity), 0))
FROM (VALUES ('Guest', @GuestId), ('Account', @AccountId)) v(RoleName, CustomerId)
LEFT JOIN ShoppingCartItem sci ON sci.CustomerId = v.CustomerId AND sci.StoreId = @StoreId
    AND sci.ProductId = @ProductId AND sci.ShoppingCartTypeId = 1
WHERE v.CustomerId IS NOT NULL
GROUP BY v.RoleName, v.CustomerId;
SELECT CONCAT('N02_CART|', v.RoleName, '|customer=', v.CustomerId, '|store=', sci.StoreId,
    '|item=', sci.Id, '|product=', sci.ProductId, '|qty=', sci.Quantity,
    '|attributes=', COALESCE(sci.AttributesXml, ''))
FROM (VALUES ('Guest', @GuestId), ('Account', @AccountId)) v(RoleName, CustomerId)
JOIN ShoppingCartItem sci ON sci.CustomerId = v.CustomerId AND sci.StoreId = @StoreId
    AND sci.ProductId = @ProductId AND sci.ShoppingCartTypeId = 1
WHERE v.CustomerId IS NOT NULL
ORDER BY v.RoleName, sci.Id;
SELECT CONCAT('N02_COUPON|', v.RoleName, '|count=', COUNT(ga.Id))
FROM (VALUES ('Guest', @GuestId), ('Account', @AccountId)) v(RoleName, CustomerId)
LEFT JOIN GenericAttribute ga ON ga.EntityId = v.CustomerId AND ga.KeyGroup = 'Customer'
    AND ga.[Key] IN ('DiscountCouponCode', 'GiftCardCouponCodes')
WHERE v.CustomerId IS NOT NULL
GROUP BY v.RoleName;
`;
  return executeReadonlySql(sql, true);
}

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
WHERE p.Sku IN ('PW-SIMPLE-001', 'PW-SHIRT', 'PW-OOS-001') AND p.Deleted = 0
ORDER BY p.Sku;

SELECT CONCAT('VARIANT|', p.Sku, '|', pac.StockQuantity, '|', pac.AttributesXml)
FROM ProductAttributeCombination pac
INNER JOIN Product p ON p.Id = pac.ProductId
WHERE p.Sku = 'PW-SHIRT'
ORDER BY pac.Id;

SELECT CONCAT('DISCOUNT|', d.CouponCode, '|', CONVERT(varchar(32), d.DiscountPercentage), '|', CONVERT(varchar(8), d.IsActive))
FROM Discount d
WHERE d.CouponCode = 'PW-CART-10PCT'
ORDER BY d.Id;

-- Deterministic order: callers compare snapshots as exact strings.
SELECT CONCAT('CART|', p.Sku, '|', sci.Quantity, '|', sci.AttributesXml)
FROM ShoppingCartItem sci
INNER JOIN Product p ON p.Id = sci.ProductId
WHERE sci.ShoppingCartTypeId = 1
  AND p.Sku IN ('PW-SIMPLE-001', 'PW-SHIRT', 'PW-OOS-001')
ORDER BY sci.Id;

SELECT CONCAT('COUPON|', ga.Value)
FROM GenericAttribute ga
WHERE ga.KeyGroup = 'Customer'
  AND ga.[Key] = 'DiscountCouponCode'
  AND ga.Value LIKE '%PW-CART-10PCT%'
ORDER BY ga.Id;
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

DECLARE @LatestOrderId int = (
  SELECT TOP 1 o.Id FROM [Order] o
  LEFT JOIN Address ba ON ba.Id = o.BillingAddressId
  WHERE o.Deleted = 0
    AND ((@CustomerId IS NOT NULL AND o.CustomerId = @CustomerId) OR ba.Email = @Email)
  ORDER BY o.Id DESC
);
SELECT CONCAT('ORDER_ITEM|', oi.OrderId, '|', p.Sku, '|', oi.Quantity)
FROM OrderItem oi
INNER JOIN Product p ON p.Id = oi.ProductId
WHERE oi.OrderId = @LatestOrderId
ORDER BY p.Sku, oi.Id;

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

/**
 * nopCommerce rejects a second order by the same customer within
 * OrderSettings.MinimumOrderPlacementInterval minutes ("Please wait several
 * seconds before placing a new order"). Returns how long the registered
 * account must wait so a repeated checkout case does not depend on the
 * previous invocation. The store setting is read, never changed.
 */
export async function queryOrderPlacementWait(customerEmail: string): Promise<{ intervalMinutes: number; secondsSinceLastOrder: number | null; waitMs: number }> {
  const escapedEmail = customerEmail.replaceAll("'", "''");
  const output = await executeReadonlySql(`
SET NOCOUNT ON;
DECLARE @CustomerId int = (SELECT TOP 1 Id FROM Customer WHERE Email = N'${escapedEmail}' AND Deleted = 0 ORDER BY Id DESC);
SELECT CONCAT('INTERVAL|', COALESCE((SELECT TOP 1 Value FROM Setting WHERE Name = 'ordersettings.minimumorderplacementinterval' ORDER BY StoreId DESC), '0'));
SELECT CONCAT('SINCE|', COALESCE(CONVERT(varchar(32), DATEDIFF(second, MAX(o.CreatedOnUtc), SYSUTCDATETIME())), '-'))
FROM [Order] o WHERE @CustomerId IS NOT NULL AND o.CustomerId = @CustomerId;
`);
  const field = (marker: string) => output.split('\n').map(line => line.trim()).find(line => line.startsWith(`${marker}|`))?.slice(marker.length + 1);
  const intervalMinutes = Number(field('INTERVAL') ?? '0');
  const since = field('SINCE');
  const secondsSinceLastOrder = since && since !== '-' ? Number(since) : null;
  if (!Number.isFinite(intervalMinutes) || (secondsSinceLastOrder !== null && !Number.isFinite(secondsSinceLastOrder))) {
    throw new Error(`Order placement interval query returned '${output}'.`);
  }
  const requiredSeconds = intervalMinutes > 0 ? intervalMinutes * 60 + 5 : 0;
  const waitMs = secondsSinceLastOrder === null ? 0 : Math.max(0, requiredSeconds - secondsSinceLastOrder) * 1000;
  return { intervalMinutes, secondsSinceLastOrder, waitMs };
}

export function executeReadonlySql(sql: string, wide = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('docker.exe', [
      'exec', '-i', runtimeConfig.databaseContainer,
      // mssql-tools18 on newer images, mssql-tools on older ones (e.g. 2019-CU18).
      'sh', '-c', 'S=/opt/mssql-tools18/bin/sqlcmd; [ -x "$S" ] || S=/opt/mssql-tools/bin/sqlcmd; exec "$S" "$@"', 'sh',
      '-C', '-S', 'localhost', '-U', 'sa', '-P', runtimeConfig.sqlPassword,
      '-d', runtimeConfig.databaseName, '-b',
      ...(wide ? ['-w', '65535', '-y', '0'] : ['-h', '-1', '-W']), '-s', '|',
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
