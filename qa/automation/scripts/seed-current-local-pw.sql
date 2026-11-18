SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() NOT LIKE N'%nopcommerce%' THROW 51000, 'Only a local nopcommerce database is supported.', 1;
IF EXISTS (SELECT 1 FROM dbo.Product WHERE Sku IN ('PW-SIMPLE-001','PW-SHIRT','PW-OOS-001'))
    THROW 51000, 'PW product already exists; seed is intentionally one-time.', 1;
IF EXISTS (SELECT 1 FROM dbo.Discount WHERE CouponCode='PW-CART-10PCT')
    THROW 51000, 'PW coupon already exists; seed is intentionally one-time.', 1;

DECLARE @source int = (SELECT TOP 1 Id FROM dbo.Product WHERE Sku LIKE 'QA-MERGE-%' AND Deleted=0 ORDER BY Id);
IF @source IS NULL THROW 51000, 'Expected QA-MERGE template product is missing.', 1;

BEGIN TRANSACTION;
DECLARE @columns nvarchar(max), @selects nvarchar(max), @sql nvarchar(max);
SELECT
    @columns = STRING_AGG(CONVERT(nvarchar(max), QUOTENAME(name)), ',') WITHIN GROUP (ORDER BY column_id),
    @selects = STRING_AGG(CONVERT(nvarchar(max),
        CASE name
            WHEN 'Name' THEN '@name'
            WHEN 'Sku' THEN '@sku'
            WHEN 'Price' THEN '@price'
            WHEN 'ManageInventoryMethodId' THEN '@inventory'
            WHEN 'StockQuantity' THEN '@stock'
            WHEN 'Published' THEN 'CONVERT(bit,1)'
            WHEN 'Deleted' THEN 'CONVERT(bit,0)'
            WHEN 'IsTaxExempt' THEN 'CONVERT(bit,1)'
            WHEN 'IsFreeShipping' THEN 'CONVERT(bit,1)'
            WHEN 'BackorderModeId' THEN '0'
            WHEN 'OrderMinimumQuantity' THEN '1'
            WHEN 'OrderMaximumQuantity' THEN '10000'
            WHEN 'CreatedOnUtc' THEN 'SYSUTCDATETIME()'
            WHEN 'UpdatedOnUtc' THEN 'SYSUTCDATETIME()'
            ELSE QUOTENAME(name)
        END), ',') WITHIN GROUP (ORDER BY column_id)
FROM sys.columns
WHERE object_id = OBJECT_ID('dbo.Product') AND is_identity=0 AND is_computed=0;

SET @sql = N'INSERT dbo.Product('+@columns+N') SELECT '+@selects+N' FROM dbo.Product WHERE Id=@source; SET @newId=CONVERT(int,SCOPE_IDENTITY());';
DECLARE @simple int, @variant int, @oos int;
EXEC sys.sp_executesql @sql, N'@source int,@name nvarchar(400),@sku nvarchar(400),@price decimal(18,4),@inventory int,@stock int,@newId int OUTPUT',
    @source, N'PW-Simple-Stock', N'PW-SIMPLE-001', 100, 1, 10, @simple OUTPUT;
EXEC sys.sp_executesql @sql, N'@source int,@name nvarchar(400),@sku nvarchar(400),@price decimal(18,4),@inventory int,@stock int,@newId int OUTPUT',
    @source, N'PW-Shirt-Variants', N'PW-SHIRT', 200, 2, 0, @variant OUTPUT;
EXEC sys.sp_executesql @sql, N'@source int,@name nvarchar(400),@sku nvarchar(400),@price decimal(18,4),@inventory int,@stock int,@newId int OUTPUT',
    @source, N'PW-Out-Of-Stock', N'PW-OOS-001', 50, 1, 0, @oos OUTPUT;

INSERT dbo.UrlRecord (EntityName, Slug, EntityId, IsActive, LanguageId)
VALUES ('Product','pw-simple-stock',@simple,1,0),
       ('Product','pw-shirt-variants-2',@variant,1,0),
       ('Product','pw-out-of-stock',@oos,1,0);

INSERT dbo.ProductAttribute (Name,Description) VALUES ('PW-Color','PW local fixture');
DECLARE @color int=CONVERT(int,SCOPE_IDENTITY());
INSERT dbo.ProductAttribute (Name,Description) VALUES ('PW-Size','PW local fixture');
DECLARE @size int=CONVERT(int,SCOPE_IDENTITY());

INSERT dbo.Product_ProductAttribute_Mapping
    (ProductAttributeId,ProductId,IsRequired,AttributeControlTypeId,DisplayOrder)
VALUES (@color,@variant,1,1,1);
DECLARE @colorMap int=CONVERT(int,SCOPE_IDENTITY());
INSERT dbo.Product_ProductAttribute_Mapping
    (ProductAttributeId,ProductId,IsRequired,AttributeControlTypeId,DisplayOrder)
VALUES (@size,@variant,1,1,2);
DECLARE @sizeMap int=CONVERT(int,SCOPE_IDENTITY());

INSERT dbo.ProductAttributeValue
    (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('Red',@colorMap,0,0,0,0,0,0,0,0,1,0,1);
DECLARE @red int=CONVERT(int,SCOPE_IDENTITY());
INSERT dbo.ProductAttributeValue
    (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('Blue',@colorMap,0,0,0,0,0,0,0,0,1,0,2);
DECLARE @blue int=CONVERT(int,SCOPE_IDENTITY());
INSERT dbo.ProductAttributeValue
    (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('S',@sizeMap,0,0,0,0,0,0,0,0,1,0,1);
DECLARE @small int=CONVERT(int,SCOPE_IDENTITY());
INSERT dbo.ProductAttributeValue
    (Name,ProductAttributeMappingId,AttributeValueTypeId,AssociatedProductId,ImageSquaresPictureId,PriceAdjustment,PriceAdjustmentUsePercentage,WeightAdjustment,Cost,CustomerEntersQty,Quantity,IsPreSelected,DisplayOrder)
VALUES ('M',@sizeMap,0,0,0,0,0,0,0,0,1,0,2);
DECLARE @medium int=CONVERT(int,SCOPE_IDENTITY());

DECLARE @attributeRows TABLE(ColorId int,SizeId int,Stock int);
INSERT @attributeRows VALUES (@red,@small,5),(@red,@medium,4),(@blue,@small,6),(@blue,@medium,3);
INSERT dbo.ProductAttributeCombination
    (ProductId,AttributesXml,StockQuantity,AllowOutOfStockOrders,NotifyAdminForQuantityBelow,MinStockQuantity)
SELECT @variant,
       CONCAT('<Attributes><ProductAttribute ID="',@colorMap,'"><ProductAttributeValue><Value>',ColorId,
              '</Value></ProductAttributeValue></ProductAttribute><ProductAttribute ID="',@sizeMap,
              '"><ProductAttributeValue><Value>',SizeId,
              '</Value></ProductAttributeValue></ProductAttribute></Attributes>'),
       Stock,0,1,0
FROM @attributeRows;

INSERT dbo.Discount
    (Name,CouponCode,DiscountTypeId,UsePercentage,DiscountPercentage,DiscountAmount,RequiresCouponCode,IsCumulative,DiscountLimitationId,LimitationTimes,AppliedToSubCategories,IsActive)
VALUES ('PW-CART-10PCT','PW-CART-10PCT',20,1,10,0,1,0,0,0,0,1);

IF NOT EXISTS (SELECT 1 FROM dbo.ShippingByWeightByTotalRecord WHERE ShippingMethodId=1 AND StoreId=0 AND WarehouseId=0 AND CountryId=0 AND StateProvinceId=0)
    INSERT dbo.ShippingByWeightByTotalRecord
        (WeightFrom,WeightTo,OrderSubtotalFrom,OrderSubtotalTo,AdditionalFixedCost,PercentageRateOfSubtotal,RatePerWeightUnit,LowerWeightLimit,StoreId,WarehouseId,CountryId,StateProvinceId,ShippingMethodId)
    VALUES (0,1000000,0,1000000,0,0,0,0,0,0,0,0,1);

IF (SELECT COUNT(*) FROM dbo.Product WHERE Sku IN ('PW-SIMPLE-001','PW-SHIRT','PW-OOS-001') AND Deleted=0)<>3
    THROW 51000, 'Product postcondition failed.', 1;
IF (SELECT COUNT(*) FROM dbo.ProductAttributeCombination WHERE ProductId=@variant)<>4
    THROW 51000, 'Variant postcondition failed.', 1;
COMMIT TRANSACTION;
SELECT 'PW fixture seed committed',@simple,@variant,@oos;
