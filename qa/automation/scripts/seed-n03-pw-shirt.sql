SET NOCOUNT ON;
SET XACT_ABORT ON;
-- SCRUM-91: minimal one-time seed for N03 on a FRESH local nopCommerce install.
-- Creates only PW-SHIRT (Red/Blue x S/M, stock 5/4/6/3) and the Ground fixed rate.
-- Same data model as seed-current-local-pw.sql, but clones any existing simple product
-- instead of requiring a QA-MERGE-* template. Local database only; runs in one transaction.

IF DB_NAME() NOT LIKE N'%nopcommerce%' THROW 51000, 'Only a local nopcommerce database is supported.', 1;
IF EXISTS (SELECT 1 FROM dbo.Product WHERE Sku = 'PW-SHIRT')
    THROW 51000, 'PW-SHIRT already exists; seed is intentionally one-time.', 1;
IF EXISTS (SELECT 1 FROM dbo.ProductAttribute WHERE Name IN ('PW-Color', 'PW-Size'))
    THROW 51000, 'PW attributes already exist; seed is intentionally one-time.', 1;

-- A fresh install without sample data has no Product rows to clone, so every NOT NULL column
-- gets a type-based default (0 / empty string / now) and the columns below are overridden.
DECLARE @tpl int = COALESCE((SELECT TOP 1 Id FROM dbo.ProductTemplate ORDER BY Id), 1);

BEGIN TRANSACTION;
DECLARE @columns nvarchar(max), @selects nvarchar(max), @sql nvarchar(max);
SELECT
    @columns = STRING_AGG(CONVERT(nvarchar(max), QUOTENAME(c.name)), ',') WITHIN GROUP (ORDER BY c.column_id),
    @selects = STRING_AGG(CONVERT(nvarchar(max),
        CASE c.name
            WHEN 'ProductTypeId' THEN '5'
            WHEN 'ProductTemplateId' THEN '@tpl'
            WHEN 'NotifyAdminForQuantityBelow' THEN '1'
            WHEN 'MaximumCustomerEnteredPrice' THEN '1000'
            WHEN 'MaxNumberOfDownloads' THEN '10'
            WHEN 'Name' THEN '@name'
            WHEN 'Sku' THEN '@sku'
            WHEN 'Price' THEN '@price'
            WHEN 'ManageInventoryMethodId' THEN '@inventory'
            WHEN 'StockQuantity' THEN '@stock'
            WHEN 'Published' THEN 'CONVERT(bit,1)'
            WHEN 'Deleted' THEN 'CONVERT(bit,0)'
            WHEN 'VisibleIndividually' THEN 'CONVERT(bit,1)'
            WHEN 'IsTaxExempt' THEN 'CONVERT(bit,1)'
            WHEN 'IsFreeShipping' THEN 'CONVERT(bit,1)'
            WHEN 'IsShipEnabled' THEN 'CONVERT(bit,1)'
            WHEN 'DisableBuyButton' THEN 'CONVERT(bit,0)'
            WHEN 'CallForPrice' THEN 'CONVERT(bit,0)'
            WHEN 'HasTierPrices' THEN 'CONVERT(bit,0)'
            WHEN 'HasDiscountsApplied' THEN 'CONVERT(bit,0)'
            WHEN 'RequireOtherProducts' THEN 'CONVERT(bit,0)'
            WHEN 'AutomaticallyAddRequiredProducts' THEN 'CONVERT(bit,0)'
            WHEN 'LimitedToStores' THEN 'CONVERT(bit,0)'
            WHEN 'SubjectToAcl' THEN 'CONVERT(bit,0)'
            WHEN 'BackorderModeId' THEN '0'
            WHEN 'OrderMinimumQuantity' THEN '1'
            WHEN 'OrderMaximumQuantity' THEN '10000'
            WHEN 'CreatedOnUtc' THEN 'SYSUTCDATETIME()'
            WHEN 'UpdatedOnUtc' THEN 'SYSUTCDATETIME()'
            ELSE
                CASE WHEN c.is_nullable = 1 THEN 'NULL'
                     WHEN t.name IN ('nvarchar', 'varchar', 'nchar', 'char') THEN ''''''
                     WHEN t.name IN ('datetime', 'datetime2') THEN 'SYSUTCDATETIME()'
                     WHEN t.name = 'uniqueidentifier' THEN 'NEWID()'
                     ELSE '0' END
        END), ',') WITHIN GROUP (ORDER BY c.column_id)
FROM sys.columns c
JOIN sys.types t ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.Product') AND c.is_identity = 0 AND c.is_computed = 0;

SET @sql = N'INSERT dbo.Product(' + @columns + N') SELECT ' + @selects + N'; SET @newId=CONVERT(int,SCOPE_IDENTITY());';
DECLARE @variant int;
EXEC sys.sp_executesql @sql,
    N'@tpl int,@name nvarchar(400),@sku nvarchar(400),@price decimal(18,4),@inventory int,@stock int,@newId int OUTPUT',
    @tpl, N'PW-Shirt-Variants', N'PW-SHIRT', 200, 2, 0, @variant OUTPUT;

INSERT dbo.UrlRecord (EntityName, Slug, EntityId, IsActive, LanguageId)
VALUES ('Product', 'pw-shirt-variants', @variant, 1, 0);

INSERT dbo.ProductAttribute (Name, Description) VALUES ('PW-Color', 'PW local fixture');
DECLARE @color int = CONVERT(int, SCOPE_IDENTITY());
INSERT dbo.ProductAttribute (Name, Description) VALUES ('PW-Size', 'PW local fixture');
DECLARE @size int = CONVERT(int, SCOPE_IDENTITY());

INSERT dbo.Product_ProductAttribute_Mapping (ProductAttributeId, ProductId, IsRequired, AttributeControlTypeId, DisplayOrder)
VALUES (@color, @variant, 1, 1, 1);
DECLARE @colorMap int = CONVERT(int, SCOPE_IDENTITY());
INSERT dbo.Product_ProductAttribute_Mapping (ProductAttributeId, ProductId, IsRequired, AttributeControlTypeId, DisplayOrder)
VALUES (@size, @variant, 1, 1, 2);
DECLARE @sizeMap int = CONVERT(int, SCOPE_IDENTITY());

INSERT dbo.ProductAttributeValue (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('Red',@colorMap,0,0,0,0,0,0,0,0,1,0,1);
DECLARE @red int = CONVERT(int, SCOPE_IDENTITY());
INSERT dbo.ProductAttributeValue (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('Blue',@colorMap,0,0,0,0,0,0,0,0,1,0,2);
DECLARE @blue int = CONVERT(int, SCOPE_IDENTITY());
INSERT dbo.ProductAttributeValue (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('S',@sizeMap,0,0,0,0,0,0,0,0,1,0,1);
DECLARE @small int = CONVERT(int, SCOPE_IDENTITY());
INSERT dbo.ProductAttributeValue (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('M',@sizeMap,0,0,0,0,0,0,0,0,1,0,2);
DECLARE @medium int = CONVERT(int, SCOPE_IDENTITY());

DECLARE @attributeRows TABLE (ColorId int, SizeId int, Stock int);
INSERT @attributeRows VALUES (@red,@small,5),(@red,@medium,4),(@blue,@small,6),(@blue,@medium,3);
INSERT dbo.ProductAttributeCombination (ProductId,AttributesXml,StockQuantity,AllowOutOfStockOrders,NotifyAdminForQuantityBelow,MinStockQuantity)
SELECT @variant,
       CONCAT('<Attributes><ProductAttribute ID="',@colorMap,'"><ProductAttributeValue><Value>',ColorId,
              '</Value></ProductAttributeValue></ProductAttribute><ProductAttribute ID="',@sizeMap,
              '"><ProductAttributeValue><Value>',SizeId,
              '</Value></ProductAttributeValue></ProductAttribute></Attributes>'),
       Stock, 0, 1, 0
FROM @attributeRows;

IF NOT EXISTS (SELECT 1 FROM dbo.ShippingByWeightByTotalRecord WHERE ShippingMethodId=1 AND StoreId=0 AND WarehouseId=0 AND CountryId=0 AND StateProvinceId=0)
    INSERT dbo.ShippingByWeightByTotalRecord
        (WeightFrom,WeightTo,OrderSubtotalFrom,OrderSubtotalTo,AdditionalFixedCost,PercentageRateOfSubtotal,RatePerWeightUnit,LowerWeightLimit,StoreId,WarehouseId,CountryId,StateProvinceId,ShippingMethodId)
    VALUES (0,1000000,0,1000000,0,0,0,0,0,0,0,0,1);

IF (SELECT COUNT(*) FROM dbo.ProductAttributeCombination WHERE ProductId = @variant) <> 4
    THROW 51000, 'Variant postcondition failed.', 1;
COMMIT TRANSACTION;
SELECT CONCAT('N03 seed committed|product=', @variant);
