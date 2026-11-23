[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [guid]$GuestGuid,
    [string]$AccountEmail = '',
    [ValidateRange(1, 2147483647)]
    [int]$StoreId = 1,
    [string]$Container = 'nopcommerce_mssql_server',
    [string]$Database = 'nopcommerce',
    [string]$StoreContainer = 'nopcommerce',
    [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
if ($Container -ne 'nopcommerce_mssql_server' -or $Database -ne 'nopcommerce' -or $StoreContainer -ne 'nopcommerce') {
    throw 'FIXTURE_BLOCKED: N02 reset only permits the named local nopcommerce containers and database.'
}
if ([string]::IsNullOrWhiteSpace($env:QA_SQL_PASSWORD)) {
    throw 'FIXTURE_BLOCKED: QA_SQL_PASSWORD is required.'
}
if ($AccountEmail -and $AccountEmail -notmatch '^qa\.n02\.[a-zA-Z0-9._%+\-]+@example\.test$') {
    throw 'FIXTURE_BLOCKED: N02 reset requires a dedicated qa.n02.*@example.test account.'
}

& docker.exe inspect --type container $Container | Out-Null
if ($LASTEXITCODE -ne 0) { throw "FIXTURE_BLOCKED: local database container '$Container' is unavailable." }
if (-not $ValidateOnly) {
    & docker.exe inspect --type container $StoreContainer | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "FIXTURE_BLOCKED: local store container '$StoreContainer' is unavailable." }
}

$validateValue = if ($ValidateOnly) { '1' } else { '0' }
$accountEmailValue = if ($AccountEmail) { $AccountEmail } else { 'NONE' }
$sql = @'
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'nopcommerce' THROW 51000, 'FIXTURE_BLOCKED: unexpected database.', 1;

DECLARE @GuestGuid uniqueidentifier = CONVERT(uniqueidentifier, '$(GuestGuid)');
DECLARE @AccountEmail nvarchar(255) = N'$(AccountEmail)';
DECLARE @StoreId int = CONVERT(int, '$(StoreId)');
DECLARE @GuestId int = (SELECT Id FROM Customer WHERE CustomerGuid = @GuestGuid AND Deleted = 0 AND Active = 1);
DECLARE @AccountId int = (SELECT TOP 1 Id FROM Customer WHERE Email = @AccountEmail AND Deleted = 0 AND Active = 1 ORDER BY Id DESC);
DECLARE @ProductId int = (SELECT Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);

IF NOT EXISTS (SELECT 1 FROM Store WHERE Id = @StoreId)
    THROW 51000, 'FIXTURE_BLOCKED: N02 store does not exist.', 1;
IF @GuestId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: guest cookie did not resolve to an active customer.', 1;
IF @AccountEmail <> N'NONE' AND (@AccountId IS NULL OR @AccountId = @GuestId)
    THROW 51000, 'FIXTURE_BLOCKED: registered account is missing or equals guest.', 1;
IF @ProductId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: PW-SHIRT product is missing.', 1;
IF NOT EXISTS (SELECT 1 FROM Product WHERE Id = @ProductId AND Published = 1
    AND ManageInventoryMethodId = 2 AND BackorderModeId = 0 AND Price = 200)
    THROW 51000, 'FIXTURE_BLOCKED: PW-SHIRT price or inventory settings differ from N02 oracle.', 1;

DECLARE @Red int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'Red');
DECLARE @Blue int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'Blue');
DECLARE @Small int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'S');
DECLARE @Medium int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'M');
IF @Red IS NULL OR @Blue IS NULL OR @Small IS NULL OR @Medium IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: N02 variant values are missing.', 1;

DECLARE @RedSmallId int = (SELECT TOP 1 Id FROM ProductAttributeCombination
    WHERE ProductId = @ProductId AND AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Red) + '</Value>%'
      AND AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Small) + '</Value>%');
DECLARE @BlueMediumId int = (SELECT TOP 1 Id FROM ProductAttributeCombination
    WHERE ProductId = @ProductId AND AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Blue) + '</Value>%'
      AND AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Medium) + '</Value>%');
IF @RedSmallId IS NULL OR @BlueMediumId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: Red/S or Blue/M stock combination is missing.', 1;
IF EXISTS (SELECT 1 FROM ProductAttributeCombination
    WHERE Id IN (@RedSmallId, @BlueMediumId) AND AllowOutOfStockOrders <> 0)
    THROW 51000, 'FIXTURE_BLOCKED: N02 variants permit out-of-stock orders.', 1;
IF EXISTS (SELECT 1 FROM GenericAttribute
    WHERE KeyGroup = 'Customer' AND [Key] IN ('DiscountCouponCode', 'GiftCardCouponCodes')
      AND (EntityId = @GuestId OR EntityId = @AccountId)
      AND NULLIF(LTRIM(RTRIM([Value])), N'') IS NOT NULL)
    THROW 51000, 'FIXTURE_BLOCKED: N02 customers have an active coupon or gift card; use clean QA customers.', 1;

IF '$(ValidateOnly)' = '1'
BEGIN
    SELECT CONCAT('N02_PREFLIGHT|store=', @StoreId, '|guest=', @GuestId,
        '|account=', COALESCE(CONVERT(varchar(20), @AccountId), '-'), '|product=', @ProductId,
        '|redS=', @RedSmallId, '|blueM=', @BlueMediumId);
    RETURN;
END;

BEGIN TRANSACTION;
DECLARE @OtherCartRowsBefore int = (SELECT COUNT(*) FROM ShoppingCartItem
    WHERE ShoppingCartTypeId = 1 AND StoreId = @StoreId AND ProductId = @ProductId
      AND CustomerId <> @GuestId AND (@AccountId IS NULL OR CustomerId <> @AccountId));
DECLARE @OtherFixtureRowsBefore int = (SELECT COUNT(*) FROM ShoppingCartItem
    WHERE (CustomerId = @GuestId OR CustomerId = @AccountId)
      AND NOT (ShoppingCartTypeId = 1 AND StoreId = @StoreId AND ProductId = @ProductId));
DELETE FROM ShoppingCartItem
WHERE ShoppingCartTypeId = 1 AND StoreId = @StoreId AND ProductId = @ProductId
  AND (CustomerId = @GuestId OR CustomerId = @AccountId);
DECLARE @DeletedCartRows int = @@ROWCOUNT;

UPDATE ProductAttributeCombination SET StockQuantity = 5 WHERE Id = @RedSmallId;
UPDATE ProductAttributeCombination SET StockQuantity = 3 WHERE Id = @BlueMediumId;
IF @OtherCartRowsBefore <> (SELECT COUNT(*) FROM ShoppingCartItem
    WHERE ShoppingCartTypeId = 1 AND StoreId = @StoreId AND ProductId = @ProductId
      AND CustomerId <> @GuestId AND (@AccountId IS NULL OR CustomerId <> @AccountId))
    THROW 51000, 'FIXTURE_BLOCKED: N02 reset changed another customer cart.', 1;
IF @OtherFixtureRowsBefore <> (SELECT COUNT(*) FROM ShoppingCartItem
    WHERE (CustomerId = @GuestId OR CustomerId = @AccountId)
      AND NOT (ShoppingCartTypeId = 1 AND StoreId = @StoreId AND ProductId = @ProductId))
    THROW 51000, 'FIXTURE_BLOCKED: N02 reset changed a non-N02 cart row.', 1;
COMMIT TRANSACTION;

SELECT CONCAT('N02_RESET|store=', @StoreId, '|guest=', @GuestId,
    '|account=', COALESCE(CONVERT(varchar(20), @AccountId), '-'),
    '|deletedCartRows=', @DeletedCartRows, '|otherCartRows=', @OtherCartRowsBefore,
    '|otherFixtureRows=', @OtherFixtureRowsBefore,
    '|redSStock=5|blueMStock=3');
'@

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $output = $sql | & docker.exe exec -i $Container /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P $env:QA_SQL_PASSWORD -d $Database -b -h -1 -W -v "GuestGuid=$GuestGuid" "AccountEmail=$accountEmailValue" "StoreId=$StoreId" "ValidateOnly=$validateValue" 2>&1 | Out-String
} catch {
    $output = $_ | Out-String
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
if ($LASTEXITCODE -ne 0) { throw "FIXTURE_BLOCKED: N02 SQL reset failed: $($output.Trim())" }
if (-not $ValidateOnly) {
    & docker.exe restart $StoreContainer | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'FIXTURE_BLOCKED: store restart failed after N02 reset.' }
}
Write-Host $output.Trim()
