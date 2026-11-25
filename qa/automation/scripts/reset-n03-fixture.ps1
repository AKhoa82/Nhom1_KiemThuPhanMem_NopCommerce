[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$AccountEmail,
    [ValidateRange(1, 2147483647)]
    [int]$StoreId = 1,
    [string]$Container = 'nopcommerce_mssql_server',
    [string]$Database = 'nopcommerce',
    [string]$StoreContainer = 'nopcommerce',
    [string]$StoreUrl = 'http://localhost/',
    [switch]$ValidateOnly,
    [switch]$NoRestart
)

# SCRUM-91 / N03: restore the CHK-RACE-01 fixture for ONE dedicated account.
#   cart  : exactly one PW-SHIRT Red/S line, quantity 4
#   stock : PW-SHIRT Red/S combination = 5
# Historical orders are never touched. Other customers' carts are never touched.
# If the account holds any other cart row, coupon or gift card the script stops
# instead of deleting it.

$ErrorActionPreference = 'Stop'
# Windows PowerShell can prepend a UTF-8 BOM to text piped to docker.exe; the sed below strips it before sqlcmd.
# Older local installs accidentally used a leading U+200B in the database name.
# Permit that exact variant while still rejecting every other database.
$normalizedDatabase = $Database.TrimStart([char]0x200B)
if ($Container -ne 'nopcommerce_mssql_server' -or $normalizedDatabase -ne 'nopcommerce' -or $StoreContainer -ne 'nopcommerce') {
    throw 'FIXTURE_BLOCKED: N03 reset only permits the named local nopcommerce containers and database.'
}
if ([string]::IsNullOrWhiteSpace($env:QA_SQL_PASSWORD)) {
    throw 'FIXTURE_BLOCKED: QA_SQL_PASSWORD is required.'
}
if ($AccountEmail -notmatch '^qa\.n03\.[a-zA-Z0-9._%+\-]+@example\.test$') {
    throw 'FIXTURE_BLOCKED: N03 reset requires a dedicated qa.n03.*@example.test account.'
}

& docker.exe inspect --type container $Container | Out-Null
if ($LASTEXITCODE -ne 0) { throw "FIXTURE_BLOCKED: local database container '$Container' is unavailable." }
if (-not $ValidateOnly -and -not $NoRestart) {
    & docker.exe inspect --type container $StoreContainer | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "FIXTURE_BLOCKED: local store container '$StoreContainer' is unavailable." }
}

$validateValue = if ($ValidateOnly) { '1' } else { '0' }
$sql = @'
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF REPLACE(DB_NAME(), NCHAR(8203), N'') <> N'nopcommerce'
    THROW 51000, 'FIXTURE_BLOCKED: unexpected database.', 1;

DECLARE @AccountEmail nvarchar(255) = N'$(AccountEmail)';
DECLARE @StoreId int = CONVERT(int, '$(StoreId)');
DECLARE @AccountId int = (SELECT TOP 1 Id FROM Customer WHERE Email = @AccountEmail AND Deleted = 0 AND Active = 1 ORDER BY Id DESC);
DECLARE @ProductId int = (SELECT TOP 1 Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);

IF NOT EXISTS (SELECT 1 FROM Store WHERE Id = @StoreId)
    THROW 51000, 'FIXTURE_BLOCKED: N03 store does not exist.', 1;
IF @AccountId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: N03 account does not exist or is inactive.', 1;
IF @ProductId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: PW-SHIRT product is missing.', 1;
IF NOT EXISTS (SELECT 1 FROM Product WHERE Id = @ProductId AND Published = 1
    AND ManageInventoryMethodId = 2 AND BackorderModeId = 0)
    THROW 51000, 'FIXTURE_BLOCKED: PW-SHIRT must manage stock by attributes without backorder.', 1;

DECLARE @Red int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'Red');
DECLARE @Small int = (SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
    JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @ProductId AND pav.Name = 'S');
IF @Red IS NULL OR @Small IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: Red or S attribute value is missing.', 1;

DECLARE @RedSmallId int = (SELECT TOP 1 Id FROM ProductAttributeCombination
    WHERE ProductId = @ProductId
      AND AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Red) + '</Value>%'
      AND AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @Small) + '</Value>%');
IF @RedSmallId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: Red/S stock combination is missing.', 1;
IF EXISTS (SELECT 1 FROM ProductAttributeCombination WHERE Id = @RedSmallId AND AllowOutOfStockOrders <> 0)
    THROW 51000, 'FIXTURE_BLOCKED: Red/S permits out-of-stock orders.', 1;

IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE Customer_Id = @AccountId)
    THROW 51000, 'FIXTURE_BLOCKED: N03 account has no saved address; create one in the storefront first.', 1;
IF EXISTS (SELECT 1 FROM ShoppingCartItem WHERE CustomerId = @AccountId
    AND NOT (ShoppingCartTypeId = 1 AND StoreId = @StoreId AND ProductId = @ProductId))
    THROW 51000, 'FIXTURE_BLOCKED: N03 account has a non-N03 cart or wishlist row; clear it manually.', 1;
IF EXISTS (SELECT 1 FROM GenericAttribute
    WHERE KeyGroup = 'Customer' AND EntityId = @AccountId
      AND [Key] IN ('DiscountCouponCode', 'GiftCardCouponCodes')
      AND NULLIF(LTRIM(RTRIM([Value])), N'') IS NOT NULL)
    THROW 51000, 'FIXTURE_BLOCKED: N03 account has an active coupon or gift card.', 1;

IF '$(ValidateOnly)' = '1'
BEGIN
    SELECT CONCAT('N03_PREFLIGHT|store=', @StoreId, '|account=', @AccountId,
        '|product=', @ProductId, '|redS=', @RedSmallId,
        '|stock=', (SELECT StockQuantity FROM ProductAttributeCombination WHERE Id = @RedSmallId),
        '|cartRows=', (SELECT COUNT(*) FROM ShoppingCartItem WHERE CustomerId = @AccountId),
        '|cartQty=', COALESCE((SELECT SUM(Quantity) FROM ShoppingCartItem WHERE CustomerId = @AccountId), 0));
    RETURN;
END;

BEGIN TRANSACTION;
DECLARE @OtherCartRowsBefore int = (SELECT COUNT(*) FROM ShoppingCartItem WHERE CustomerId <> @AccountId);
DECLARE @OrdersBefore int = (SELECT COUNT(*) FROM [Order]);
DECLARE @OtherStockBefore bigint = (SELECT COALESCE(SUM(CONVERT(bigint, StockQuantity)), 0)
    FROM ProductAttributeCombination WHERE Id <> @RedSmallId);

DELETE FROM ShoppingCartItem
WHERE CustomerId = @AccountId AND ShoppingCartTypeId = 1 AND StoreId = @StoreId AND ProductId = @ProductId;
DECLARE @DeletedCartRows int = @@ROWCOUNT;

-- A leftover payment request would let the next attempt reuse an OrderGuid.
DELETE FROM GenericAttribute
WHERE KeyGroup = 'Customer' AND EntityId = @AccountId AND [Key] = 'ProcessPaymentRequest'
  AND StoreId = @StoreId;
DECLARE @DeletedPaymentRequests int = @@ROWCOUNT;

UPDATE ProductAttributeCombination SET StockQuantity = 5 WHERE Id = @RedSmallId;

DECLARE @Now datetime2 = SYSUTCDATETIME();
INSERT INTO ShoppingCartItem (StoreId, ShoppingCartTypeId, CustomerId, ProductId, AttributesXml,
    CustomerEnteredPrice, Quantity, CreatedOnUtc, UpdatedOnUtc)
SELECT @StoreId, 1, @AccountId, @ProductId, pac.AttributesXml, 0, 4, @Now, @Now
FROM ProductAttributeCombination pac WHERE pac.Id = @RedSmallId;

IF @OtherCartRowsBefore <> (SELECT COUNT(*) FROM ShoppingCartItem WHERE CustomerId <> @AccountId)
    THROW 51000, 'FIXTURE_BLOCKED: N03 reset changed another customer cart.', 1;
IF @OrdersBefore <> (SELECT COUNT(*) FROM [Order])
    THROW 51000, 'FIXTURE_BLOCKED: N03 reset changed the order count.', 1;
IF @OtherStockBefore <> (SELECT COALESCE(SUM(CONVERT(bigint, StockQuantity)), 0)
    FROM ProductAttributeCombination WHERE Id <> @RedSmallId)
    THROW 51000, 'FIXTURE_BLOCKED: N03 reset changed stock of another variant.', 1;
IF (SELECT COUNT(*) FROM ShoppingCartItem WHERE CustomerId = @AccountId) <> 1
    THROW 51000, 'FIXTURE_BLOCKED: N03 cart is not exactly one line after reset.', 1;
COMMIT TRANSACTION;

SELECT CONCAT('N03_RESET|store=', @StoreId, '|account=', @AccountId,
    '|deletedCartRows=', @DeletedCartRows, '|deletedPaymentRequests=', @DeletedPaymentRequests,
    '|ordersUntouched=', @OrdersBefore, '|redSStock=5|cartQty=4');
'@

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $output = $sql | & docker.exe exec -i $Container sh -c 'S=/opt/mssql-tools18/bin/sqlcmd; [ -x $S ] || S=/opt/mssql-tools/bin/sqlcmd; B=$(printf ''\357\273\277''); sed -e s/^$B// | $S $@' sh -C -S localhost -U sa -P $env:QA_SQL_PASSWORD -d $Database -b -h -1 -W -v "AccountEmail=$AccountEmail" "StoreId=$StoreId" "ValidateOnly=$validateValue" 2>&1 | Out-String
} catch {
    $output = $_ | Out-String
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
if ($LASTEXITCODE -ne 0) { throw "FIXTURE_BLOCKED: N03 SQL reset failed: $($output.Trim())" }

if (-not $ValidateOnly -and -not $NoRestart) {
    # nopCommerce caches stock in memory; restart so the storefront reads the reset value.
    & docker.exe restart $StoreContainer | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'FIXTURE_BLOCKED: store restart failed after N03 reset.' }
    $ready = $false
    for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
        try {
            $r = Invoke-WebRequest -Uri ($StoreUrl.TrimEnd('/') + '/cart') -UseBasicParsing -TimeoutSec 5
            $ready = ($r.StatusCode -eq 200)
        } catch { Start-Sleep -Seconds 2 }
    }
    if (-not $ready) { throw "FIXTURE_BLOCKED: storefront at $StoreUrl did not become ready after restart." }
}
Write-Host $output.Trim()
