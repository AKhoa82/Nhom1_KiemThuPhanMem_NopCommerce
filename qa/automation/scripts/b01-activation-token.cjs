const { spawnSync } = require('node:child_process');

const mode = process.argv[2];
const token = process.argv[3];
const email = process.env.QA_REGISTERED_EMAIL ?? '';
if (!['setup', 'cleanup'].includes(mode)) throw new Error('Use setup or cleanup');
if (!/^[0-9a-f-]{36}$/i.test(token ?? '')) throw new Error('A UUID token is required');
if (!/^qa\.n02\.[a-zA-Z0-9._%+\-]+@example\.test$/.test(email))
  throw new Error('Only the dedicated N02 account is allowed');
if (!process.env.QA_SQL_PASSWORD) throw new Error('QA_SQL_PASSWORD is required');

const sql = `SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'nopcommerce' THROW 51000, 'Wrong database', 1;
DECLARE @customerId int = (SELECT Id FROM Customer WHERE Email = N'${email}' AND Deleted = 0);
IF @customerId IS NULL THROW 51000, 'N02 account is missing', 1;
DECLARE @token nvarchar(400) = N'${token}';
IF EXISTS (SELECT 1 FROM GenericAttribute WHERE EntityId = @customerId
  AND KeyGroup = 'Customer' AND [Key] = 'AccountActivationToken'
  AND StoreId = 0 AND Value NOT IN (N'', @token))
  THROW 51000, 'Unrelated activation token exists', 1;
BEGIN TRANSACTION;
DELETE FROM GenericAttribute WHERE EntityId = @customerId
  AND KeyGroup = 'Customer' AND [Key] = 'AccountActivationToken' AND StoreId = 0
  AND Value IN (N'', @token);
${mode === 'setup' ? `INSERT INTO GenericAttribute (EntityId, KeyGroup, [Key], Value, StoreId, CreatedOrUpdatedDateUTC)
VALUES (@customerId, 'Customer', 'AccountActivationToken', @token, 0, GETUTCDATE());` : ''}
COMMIT TRANSACTION;
SELECT 'B01_ACTIVATION_TOKEN_${mode.toUpperCase()}';`;
const result = spawnSync('docker.exe', [
  'exec', '-i', 'nopcommerce_mssql_server', '/opt/mssql-tools18/bin/sqlcmd',
  '-C', '-S', 'localhost', '-U', 'sa', '-P', process.env.QA_SQL_PASSWORD,
  '-d', 'nopcommerce', '-b', '-h', '-1', '-W',
], { input: sql, encoding: 'utf8', windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || result.stdout);
process.stdout.write(result.stdout);
