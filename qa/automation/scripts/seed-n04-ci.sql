SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'nopcommerce' THROW 51000, 'N04 requires the ephemeral nopcommerce database.', 1;
IF (SELECT COUNT(*) FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0) <> 1
    THROW 51000, 'Run seed-n03-pw-shirt.sql first on a fresh install.', 1;
IF EXISTS (SELECT 1 FROM Product WHERE Sku IN ('PW-SIMPLE-001', 'PW-OOS-001'))
    THROW 51000, 'N04 CI seed must run once on a fresh database.', 1;

BEGIN TRANSACTION;
DECLARE @source int = (SELECT Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);
DECLARE @columns nvarchar(max), @selects nvarchar(max), @sql nvarchar(max);
SELECT @columns = STRING_AGG(CONVERT(nvarchar(max), QUOTENAME(name)), ',') WITHIN GROUP (ORDER BY column_id),
       @selects = STRING_AGG(CONVERT(nvarchar(max), CASE name
           WHEN 'Name' THEN '@name'
           WHEN 'Sku' THEN '@sku'
           WHEN 'Price' THEN '@price'
           WHEN 'ManageInventoryMethodId' THEN '1'
           WHEN 'StockQuantity' THEN '@stock'
           WHEN 'CreatedOnUtc' THEN 'SYSUTCDATETIME()'
           WHEN 'UpdatedOnUtc' THEN 'SYSUTCDATETIME()'
           ELSE QUOTENAME(name) END), ',') WITHIN GROUP (ORDER BY column_id)
FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Product') AND is_identity = 0 AND is_computed = 0;
SET @sql = N'INSERT dbo.Product(' + @columns + N') SELECT ' + @selects +
    N' FROM dbo.Product WHERE Id=@source; SET @newId=CONVERT(int,SCOPE_IDENTITY());';
DECLARE @simple int, @oos int;
EXEC sys.sp_executesql @sql,
    N'@source int,@name nvarchar(400),@sku nvarchar(400),@price decimal(18,4),@stock int,@newId int OUTPUT',
    @source, N'PW-Simple-Stock', N'PW-SIMPLE-001', 100, 10, @simple OUTPUT;
EXEC sys.sp_executesql @sql,
    N'@source int,@name nvarchar(400),@sku nvarchar(400),@price decimal(18,4),@stock int,@newId int OUTPUT',
    @source, N'PW-Out-Of-Stock', N'PW-OOS-001', 50, 0, @oos OUTPUT;
INSERT UrlRecord (EntityName, Slug, EntityId, IsActive, LanguageId)
VALUES ('Product', 'pw-simple-stock', @simple, 1, 0),
       ('Product', 'pw-out-of-stock', @oos, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Discount WHERE CouponCode = 'PW-CART-10PCT')
    INSERT Discount (Name,CouponCode,DiscountTypeId,UsePercentage,DiscountPercentage,
        DiscountAmount,RequiresCouponCode,IsCumulative,DiscountLimitationId,LimitationTimes,
        AppliedToSubCategories,IsActive)
    VALUES ('PW-CART-10PCT','PW-CART-10PCT',20,1,10,0,1,0,0,0,0,1);

IF NOT EXISTS (SELECT 1 FROM Language WHERE LanguageCulture = 'vi-VN')
    INSERT Language (Name,LanguageCulture,UniqueSeoCode,FlagImageFileName,Rtl,
        LimitedToStores,DefaultCurrencyId,Published,DisplayOrder)
    VALUES ('Tiếng Việt','vi-VN','vi','vn.png',0,0,1,1,1);
IF (SELECT Id FROM Language WHERE LanguageCulture = 'vi-VN') <> 2
    THROW 51000, 'N02 UI currently requires vi-VN language Id 2.', 1;
IF NOT EXISTS (SELECT 1 FROM LocaleStringResource
    WHERE LanguageId = 2 AND ResourceName = 'shoppingcart.quantityexceedsstock')
    INSERT LocaleStringResource (LanguageId,ResourceName,ResourceValue)
    VALUES (2,'shoppingcart.quantityexceedsstock',N'Số lượng vượt tồn kho. Số lượng tối đa có thể thêm là {0}.');

-- PW checkout automation follows the separate address/shipping/payment routes.
UPDATE [Setting] SET [Value] = 'False'
WHERE [Name] = 'ordersettings.onepagecheckoutenabled' AND StoreId = 0;
IF @@ROWCOUNT <> 1 THROW 51000, 'N04 requires the one-page checkout setting.', 1;

IF (SELECT COUNT(*) FROM Product WHERE Sku IN ('PW-SIMPLE-001','PW-SHIRT','PW-OOS-001') AND Deleted=0) <> 3
    THROW 51000, 'N04 product seed postcondition failed.', 1;
IF (SELECT COUNT(*) FROM ProductAttributeCombination WHERE ProductId = @source) <> 4
    THROW 51000, 'N04 variant seed postcondition failed.', 1;
COMMIT TRANSACTION;
SELECT 'N04_CI_SEED|PASS';
