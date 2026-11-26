-- S2-ADV-CART-AUTO fixture: the local vi-VN pack lacks ShoppingCart.QuantityExceedsStock,
-- so SCRUM-96 merge warnings show the raw key instead of the stock limit. Idempotent.
-- Run: docker cp + sqlcmd -f 65001 -i (UTF-8). Restart the store afterwards to clear the resource cache.
SET NOCOUNT ON;
DECLARE @vi int = (SELECT Id FROM Language WHERE LanguageCulture = 'vi-VN');
IF @vi IS NULL THROW 51000, 'vi-VN language missing', 1;
IF NOT EXISTS (SELECT 1 FROM LocaleStringResource WHERE LanguageId = @vi AND ResourceName = 'shoppingcart.quantityexceedsstock')
    INSERT INTO LocaleStringResource (LanguageId, ResourceName, ResourceValue)
    VALUES (@vi, 'shoppingcart.quantityexceedsstock', N'Số lượng vượt tồn kho. Số lượng tối đa có thể thêm là {0}.');
SELECT CONCAT('VI_RESOURCE|', Id, '|', ResourceValue) FROM LocaleStringResource WHERE LanguageId = @vi AND ResourceName = 'shoppingcart.quantityexceedsstock';
