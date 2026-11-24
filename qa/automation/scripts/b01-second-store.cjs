const { spawnSync } = require('node:child_process');

const mode = process.argv[2];
if (!['setup', 'cleanup'].includes(mode)) throw new Error('Use setup or cleanup');
if (!process.env.QA_SQL_PASSWORD) throw new Error('QA_SQL_PASSWORD is required');
if (mode === 'cleanup' && !/^qa\.n02\.[a-zA-Z0-9._%+\-]+@example\.test$/.test(process.env.QA_REGISTERED_EMAIL ?? ''))
  throw new Error('Cleanup requires the dedicated N02 account');

const common = `SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'nopcommerce' THROW 51000, 'Wrong database', 1;
IF (SELECT COUNT(*) FROM Store WHERE Deleted = 0) NOT IN (1, 2)
  THROW 51000, 'Unexpected store count', 1;
DECLARE @name nvarchar(400) = N'SCRUM-96 B01 local second store';
DECLARE @id int = (SELECT Id FROM Store WHERE Name = @name AND Deleted = 0);
IF @id IS NOT NULL AND (SELECT Hosts FROM Store WHERE Id = @id) <> '127.0.0.1'
  THROW 51000, 'Test store host mismatch', 1;
`;
const setup = `${common}
IF @id IS NULL
BEGIN
  IF (SELECT COUNT(*) FROM Store WHERE Deleted = 0) <> 1
    THROW 51000, 'Another store exists; refusing setup', 1;
  IF EXISTS (SELECT 1 FROM Store WHERE Id = 2)
    THROW 51000, 'Store ID 2 is already used; refusing setup', 1;
  SET IDENTITY_INSERT Store ON;
  INSERT INTO Store (Id, Name, DefaultMetaKeywords, DefaultMetaDescription, DefaultTitle,
    HomepageTitle, HomepageDescription, Url, SslEnabled, Hosts, DefaultLanguageId,
    DisplayOrder, CompanyName, CompanyAddress, CompanyPhoneNumber, CompanyVat, Deleted)
  SELECT 2, @name, DefaultMetaKeywords, DefaultMetaDescription, DefaultTitle,
    HomepageTitle, HomepageDescription, 'http://127.0.0.1/', SslEnabled, '127.0.0.1',
    DefaultLanguageId, DisplayOrder + 1, CompanyName, CompanyAddress,
    CompanyPhoneNumber, CompanyVat, 0
  FROM Store WHERE Id = 1 AND Deleted = 0;
  SET IDENTITY_INSERT Store OFF;
  SET @id = 2;
END;
SELECT CONCAT('B01_SECOND_STORE|', @id, '|127.0.0.1');`;
const cleanup = `${common}
IF @id IS NULL THROW 51000, 'Test store is missing', 1;
DECLARE @accountId int = (SELECT Id FROM Customer WHERE Email = N'${process.env.QA_REGISTERED_EMAIL ?? ''}' AND Deleted = 0);
DECLARE @productId int = (SELECT Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);
IF @accountId IS NULL OR @productId IS NULL THROW 51000, 'N02 fixture is missing', 1;
IF EXISTS (SELECT 1 FROM ShoppingCartItem WHERE StoreId = @id
  AND (CustomerId <> @accountId OR ProductId <> @productId OR ShoppingCartTypeId <> 1))
  THROW 51000, 'Test store has unrelated cart rows; refusing cleanup', 1;
IF EXISTS (SELECT 1 FROM [Order] WHERE StoreId = @id)
  THROW 51000, 'Test store has orders; refusing cleanup', 1;
BEGIN TRANSACTION;
DELETE FROM ShoppingCartItem WHERE StoreId = @id AND CustomerId = @accountId
  AND ProductId = @productId AND ShoppingCartTypeId = 1;
IF EXISTS (SELECT 1 FROM ShoppingCartItem WHERE StoreId = @id)
  THROW 51000, 'Test store still has cart rows; refusing cleanup', 1;
DELETE FROM Store WHERE Id = @id;
COMMIT TRANSACTION;
SELECT CONCAT('B01_SECOND_STORE_REMOVED|', @id);`;
const result = spawnSync('docker.exe', [
  'exec', '-i', 'nopcommerce_mssql_server', '/opt/mssql-tools18/bin/sqlcmd',
  '-C', '-S', 'localhost', '-U', 'sa', '-P', process.env.QA_SQL_PASSWORD,
  '-d', 'nopcommerce', '-b', '-h', '-1', '-W',
], { input: mode === 'setup' ? setup : cleanup, encoding: 'utf8', windowsHide: true });
if (result.error) throw result.error;
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exitCode = result.status;
