const { spawnSync } = require('node:child_process');

const sql = `SET NOCOUNT ON;
SELECT CONCAT('STORE|', Id, '|', Name, '|', Url, '|', Hosts)
FROM Store WHERE Deleted = 0 ORDER BY Id;
SELECT CONCAT('CARTS_SHARED|', Value)
FROM Setting WHERE Name = 'shoppingsettings.cartssharedbetweenstores';
SELECT CONCAT('PRODUCT|', Id, '|limited=', LimitedToStores)
FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0;`;

if (!process.env.QA_SQL_PASSWORD) throw new Error('QA_SQL_PASSWORD is required');
const result = spawnSync(process.platform === 'win32' ? 'docker.exe' : 'docker', [
  'exec', '-i', 'nopcommerce_mssql_server', '/opt/mssql-tools18/bin/sqlcmd',
  '-C', '-S', 'localhost', '-U', 'sa', '-P', process.env.QA_SQL_PASSWORD,
  '-d', 'nopcommerce', '-b', '-h', '-1', '-W',
], { input: sql, encoding: 'utf8', windowsHide: true });
if (result.error) throw result.error;
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exitCode = result.status;
