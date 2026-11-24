[CmdletBinding()]
param(
    [ValidateRange(1, 50)]
    [int]$Runs = 10,
    [Parameter(Mandatory)]
    [string]$AccountEmail,
    [ValidateRange(1, 2147483647)]
    [int]$StoreId = 1,
    # Label for the code under test, e.g. BEFORE-FIX or AFTER-FIX-<sha>.
    [Parameter(Mandatory)]
    [string]$Label,
    [string]$OutDir = '',
    [string]$Container = 'nopcommerce_mssql_server',
    [string]$Database = 'nopcommerce',
    [string]$StoreUrl = 'http://localhost/'
)

# SCRUM-91 / N03: repeat CHK-RACE-01. Every attempt = reset -> SQL before ->
# Playwright two-tab test (Trang's n03-race.spec.ts) -> SQL after -> archive.
# Raw output (traces, HTML, session data) stays under n03-local-evidence/ which is git-ignored.
# Then run:  node scripts/summarize-n03-runs.cjs <OutDir>

$ErrorActionPreference = 'Stop'
# Windows PowerShell can prepend a UTF-8 BOM to text piped to docker.exe; the sed below strips it before sqlcmd.
if ($Container -ne 'nopcommerce_mssql_server' -or $Database -ne 'nopcommerce') {
    throw 'FIXTURE_BLOCKED: N03 series only permits the named local container and database.'
}
foreach ($name in 'QA_SQL_PASSWORD', 'QA_REGISTERED_EMAIL', 'QA_REGISTERED_PASSWORD') {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) { throw "FIXTURE_BLOCKED: $name is required." }
}
if ($env:QA_REGISTERED_EMAIL -ne $AccountEmail) {
    throw 'FIXTURE_BLOCKED: QA_REGISTERED_EMAIL must equal -AccountEmail so the test and the fixture use the same account.'
}
if ($Label -notmatch '^[A-Za-z0-9._-]{1,60}$') { throw 'Label may only contain letters, digits, dot, underscore and dash.' }

$automationRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutDir) { $OutDir = Join-Path $automationRoot ("n03-local-evidence\" + $Label) }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$snapshotSql = Get-Content -Raw -Path (Join-Path $PSScriptRoot 'n03-snapshot.sql')

function Get-N03Snapshot {
    $out = $snapshotSql | & docker.exe exec -i $Container sh -c 'S=/opt/mssql-tools18/bin/sqlcmd; [ -x $S ] || S=/opt/mssql-tools/bin/sqlcmd; B=$(printf ''\357\273\277''); sed -e s/^$B// | $S $@' sh -C -S localhost -U sa -P $env:QA_SQL_PASSWORD -d $Database -b -h -1 -W -v "AccountEmail=$AccountEmail" "StoreId=$StoreId" 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw "N03 snapshot failed: $($out.Trim())" }
    return $out.Trim()
}

$commit = (& git rev-parse HEAD).Trim()
Set-Content -Encoding utf8 -Path (Join-Path $OutDir 'series.json') -Value (@{
    label = $Label; runsRequested = $Runs; sourceCommit = $commit
    startedUtc = (Get-Date).ToUniversalTime().ToString('o'); storeUrl = $StoreUrl
} | ConvertTo-Json)

Push-Location $automationRoot
try {
    for ($i = 1; $i -le $Runs; $i++) {
        $runName = 'run{0:D2}' -f $i
        $runDir = Join-Path $OutDir $runName
        New-Item -ItemType Directory -Force -Path $runDir | Out-Null
        Write-Host "=== $Label $runName ($i/$Runs) ==="

        # MinimumOrderPlacementInterval would otherwise block the next order for reasons unrelated to B02.
        $prior = Get-N03Snapshot
        $interval = [int](([regex]::Match($prior, 'ordersettings\.minimumorderplacementinterval\|(\d+)')).Groups[1].Value)
        if ($interval -gt 0 -and $i -gt 1) { Start-Sleep -Seconds ($interval + 2) }

        $reset = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'reset-n03-fixture.ps1') -AccountEmail $AccountEmail -StoreId $StoreId -StoreUrl $StoreUrl
        if ($LASTEXITCODE -ne 0) { throw "Reset failed on $runName." }
        Set-Content -Encoding utf8 -Path (Join-Path $runDir 'reset.txt') -Value $reset

        $before = Get-N03Snapshot
        Set-Content -Encoding utf8 -Path (Join-Path $runDir 'sql-before.txt') -Value $before

        $env:QA_RUN_ID = "N03-$Label-$runName"
        $env:QA_FIXTURE_VERSION = 'SCRUM-91-N03-v1'
        & npx.cmd playwright test tests/n03-race.spec.ts
        $playwrightExit = $LASTEXITCODE   # non-zero is EXPECTED while SCRUM-100 is open

        $after = Get-N03Snapshot
        Set-Content -Encoding utf8 -Path (Join-Path $runDir 'sql-after.txt') -Value $after
        if (Test-Path 'reports\results.json') { Copy-Item 'reports\results.json' (Join-Path $runDir 'results.json') -Force }
        if (Test-Path 'reports\run-manifest.json') { Copy-Item 'reports\run-manifest.json' (Join-Path $runDir 'run-manifest.json') -Force }
        if (Test-Path 'artifacts') { Copy-Item 'artifacts' (Join-Path $runDir 'artifacts') -Recurse -Force }
        Set-Content -Encoding utf8 -Path (Join-Path $runDir 'exit.txt') -Value "$playwrightExit"
        Remove-Item Env:\QA_RUN_ID -ErrorAction SilentlyContinue
    }
} finally {
    Pop-Location
}
Write-Host "Done. Summarize with: node scripts/summarize-n03-runs.cjs `"$OutDir`""
