SET NOCOUNT ON;
-- SCRUM-91 N03 read-only snapshot. sqlcmd variables: AccountEmail, StoreId.
-- Output is `KEY|field|...` lines, no address text and no e-mail.
DECLARE @AccountEmail nvarchar(255) = N'$(AccountEmail)';
DECLARE @StoreId int = CONVERT(int, '$(StoreId)');
DECLARE @CustomerId int = (SELECT TOP 1 Id FROM Customer WHERE Email = @AccountEmail AND Deleted = 0 ORDER BY Id DESC);
DECLARE @ProductId int = (SELECT TOP 1 Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);
DECLARE @Red int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'Red');
DECLARE @Small int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'S');

SELECT CONCAT('N03_SNAPSHOT_UTC|', CONVERT(varchar(33), SYSUTCDATETIME(), 126));
SELECT CONCAT('N03_CUSTOMER|id=', COALESCE(CONVERT(varchar(12), @CustomerId), '-'), '|store=', @StoreId);

SELECT CONCAT('N03_ORDER_COUNT|', COUNT_BIG(1))
FROM [Order] o WHERE o.Deleted = 0 AND o.CustomerId = @CustomerId AND o.StoreId = @StoreId;

SELECT CONCAT('N03_ORDER|id=', o.Id, '|guid=', CONVERT(varchar(36), o.OrderGuid),
    '|orderStatus=', o.OrderStatusId, '|payStatus=', o.PaymentStatusId,
    '|method=', COALESCE(o.PaymentMethodSystemName, '-'), '|ship=', COALESCE(o.ShippingRateComputationMethodSystemName, '-'),
    '|total=', CONVERT(varchar(32), o.OrderTotal), '|createdUtc=', CONVERT(varchar(33), o.CreatedOnUtc, 126))
FROM [Order] o WHERE o.Deleted = 0 AND o.CustomerId = @CustomerId AND o.StoreId = @StoreId
ORDER BY o.Id;

SELECT CONCAT('N03_ORDER_ITEM|order=', oi.OrderId, '|item=', oi.Id, '|sku=', p.Sku,
    '|qty=', oi.Quantity, '|attrs=', REPLACE(REPLACE(COALESCE(oi.AttributesXml, ''), CHAR(13), ' '), CHAR(10), ' '))
FROM OrderItem oi
JOIN [Order] o ON o.Id = oi.OrderId
JOIN Product p ON p.Id = oi.ProductId
WHERE o.Deleted = 0 AND o.CustomerId = @CustomerId AND o.StoreId = @StoreId
ORDER BY oi.OrderId, oi.Id;

-- Duplicate OrderGuid over the whole table (the unique key AK_Order_OrderGuid should make this 0).
SELECT CONCAT('N03_DUP_ORDERGUID|groups=', COUNT_BIG(1))
FROM (SELECT OrderGuid FROM [Order] GROUP BY OrderGuid HAVING COUNT_BIG(1) > 1) d;

SELECT CONCAT('N03_STOCK_RED_S|', pac.StockQuantity)
FROM ProductAttributeCombination pac
WHERE pac.ProductId = @ProductId
  AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Red) + '</Value>%'
  AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Small) + '</Value>%';

SELECT CONCAT('N03_CART|rows=', COUNT_BIG(sci.Id), '|qty=', COALESCE(SUM(sci.Quantity), 0))
FROM ShoppingCartItem sci
WHERE sci.CustomerId = @CustomerId AND sci.StoreId = @StoreId AND sci.ShoppingCartTypeId = 1;

SELECT CONCAT('N03_PAYMENT_REQUEST|present=', COUNT_BIG(1))
FROM GenericAttribute ga
WHERE ga.KeyGroup = 'Customer' AND ga.EntityId = @CustomerId AND ga.[Key] = 'ProcessPaymentRequest'
  AND ga.StoreId = @StoreId;

-- Configuration that decides which protection path is active; record it per run.
SELECT CONCAT('N03_SETTING|', s.Name, '|', s.Value, '|store=', s.StoreId)
FROM Setting s
WHERE s.Name IN ('ordersettings.placeorderwithlock', 'ordersettings.minimumorderplacementinterval',
                 'paymentsettings.regenerateorderguidinterval', 'ordersettings.onepagecheckoutenabled')
ORDER BY s.Name, s.StoreId;
