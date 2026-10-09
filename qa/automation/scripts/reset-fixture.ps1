[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^PW-\d{3}$')]
    [string]$CaseId,
    [string]$Container = 'nopcommerce_mssql_server',
    [string]$Database = 'nopcommerce',
    [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'

if ($Container -ne 'nopcommerce_mssql_server' -or $Database -ne 'nopcommerce') {
    throw 'FIXTURE_BLOCKED: reset-fixture.ps1 only permits the local nopcommerce test container/database.'
}

if ([string]::IsNullOrWhiteSpace($env:QA_SQL_PASSWORD)) {
    throw 'FIXTURE_BLOCKED: QA_SQL_PASSWORD is required to reset the local test fixture.'
}

& docker.exe inspect --type container $Container | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "FIXTURE_BLOCKED: Docker container '$Container' was not found. Start the local test environment first."
}

$validateOnlyValue = if ($ValidateOnly) { '1' } else { '0' }
$sql = @'
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SimpleProductId int = (SELECT Id FROM Product WHERE Sku = 'PW-SIMPLE-001' AND Deleted = 0);
DECLARE @VariantProductId int = (SELECT Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);
DECLARE @OutOfStockProductId int = (SELECT Id FROM Product WHERE Sku = 'PW-OOS-001' AND Deleted = 0);

IF @SimpleProductId IS NULL OR @VariantProductId IS NULL OR @OutOfStockProductId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: Required fixture SKU is missing (PW-SIMPLE-001, PW-SHIRT, or PW-OOS-001).', 1;

IF (SELECT COUNT(*) FROM ProductAttributeCombination WHERE ProductId = @VariantProductId) <> 4
    THROW 51000, 'FIXTURE_BLOCKED: PW-SHIRT must have exactly four attribute combinations.', 1;

DECLARE @RedValueId int = (
    SELECT TOP 1 pav.Id
    FROM ProductAttributeValue pav
    INNER JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @VariantProductId AND pav.Name = 'Red'
);
DECLARE @BlueValueId int = (
    SELECT TOP 1 pav.Id
    FROM ProductAttributeValue pav
    INNER JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @VariantProductId AND pav.Name = 'Blue'
);
DECLARE @SmallValueId int = (
    SELECT TOP 1 pav.Id
    FROM ProductAttributeValue pav
    INNER JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @VariantProductId AND pav.Name = 'S'
);
DECLARE @MediumValueId int = (
    SELECT TOP 1 pav.Id
    FROM ProductAttributeValue pav
    INNER JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
    WHERE pam.ProductId = @VariantProductId AND pav.Name = 'M'
);

IF @RedValueId IS NULL OR @BlueValueId IS NULL OR @SmallValueId IS NULL OR @MediumValueId IS NULL
    THROW 51000, 'FIXTURE_BLOCKED: PW-SHIRT must expose Red, Blue, S and M attribute values.', 1;

IF '$(ValidateOnly)' = '1'
BEGIN
    SELECT 'Fixture validation passed; no data changed.' AS Result;
    RETURN;
END;

BEGIN TRANSACTION;

DECLARE @AffectedCustomers TABLE (Id int PRIMARY KEY);
INSERT INTO @AffectedCustomers (Id)
SELECT DISTINCT CustomerId
FROM ShoppingCartItem
WHERE ShoppingCartTypeId = 1
  AND ProductId IN (@SimpleProductId, @VariantProductId, @OutOfStockProductId);

DELETE FROM ShoppingCartItem
WHERE ShoppingCartTypeId = 1
  AND ProductId IN (@SimpleProductId, @VariantProductId, @OutOfStockProductId);

DELETE FROM GenericAttribute
WHERE KeyGroup = 'Customer'
  AND EntityId IN (SELECT Id FROM @AffectedCustomers)
  AND [Key] IN ('DiscountCouponCode', 'CheckoutAttributes');

UPDATE Product SET StockQuantity = 10 WHERE Id = @SimpleProductId;
UPDATE Product SET StockQuantity = 0 WHERE Id = @OutOfStockProductId;

UPDATE pac
SET StockQuantity = CASE
    WHEN pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @RedValueId) + '</Value>%' AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @SmallValueId) + '</Value>%' THEN 5
    WHEN pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @RedValueId) + '</Value>%' AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @MediumValueId) + '</Value>%' THEN 4
    WHEN pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @BlueValueId) + '</Value>%' AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @SmallValueId) + '</Value>%' THEN 6
    WHEN pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @BlueValueId) + '</Value>%' AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @MediumValueId) + '</Value>%' THEN 3
    ELSE pac.StockQuantity
END
FROM ProductAttributeCombination pac
WHERE pac.ProductId = @VariantProductId;

IF @@ROWCOUNT <> 4
    THROW 51000, 'FIXTURE_BLOCKED: Failed to restore all four PW-SHIRT stock combinations.', 1;

COMMIT TRANSACTION;
SELECT 'Fixture reset completed for $(CaseId).' AS Result;
'@

$output = $sql | & docker.exe exec -i -e "SQLCMDPASSWORD=$($env:QA_SQL_PASSWORD)" $Container /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -d $Database -b -v "ValidateOnly=$validateOnlyValue" "CaseId=$CaseId" 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    throw $output.Trim()
}

Write-Host $output.Trim()
