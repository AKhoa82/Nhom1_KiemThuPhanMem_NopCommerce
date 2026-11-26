[CmdletBinding()]
param([int]$Seed = 10387, [string]$OutputDirectory = '')
$ErrorActionPreference = 'Stop'
$automationRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $automationRoot 'reports/order-check' }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$runGroup = 'RUN-' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmssfff')
$catalog = Get-Content -Raw -Encoding UTF8 (Join-Path $automationRoot 'test-data/cart-case-catalog.json') | ConvertFrom-Json
$ids = @($catalog | ForEach-Object { $_.caseId })
$runs = [Collections.Generic.List[object]]::new()
$oldReportDir = $env:QA_REPORT_DIR
$oldArtifactDir = $env:QA_ARTIFACT_DIR
function Invoke-CartRun([string]$Label, [string]$CaseId = '', [int]$Repeat = 1) {
    $runDirectory = Join-Path $OutputDirectory "$runGroup/$Label"
    $env:QA_REPORT_DIR = $runDirectory
    $env:QA_ARTIFACT_DIR = Join-Path $automationRoot "artifacts/order-check/$runGroup/$Label"
    $cli = Join-Path $automationRoot 'node_modules/@playwright/test/cli.js'
    $arguments = @($cli, 'test', 'tests/pairwise.spec.ts', 'tests/n02-cart.spec.ts', '--workers=1', "--repeat-each=$Repeat")
    if ($CaseId) {
        $pattern = if ($CaseId -like 'PW-*') { '\b' + [regex]::Escape($CaseId) + '\b' } else { '\bCART-(?:MERGE|REPEAT)-01 ' + [regex]::Escape($CaseId) + '\b' }
        $arguments += @('--grep', $pattern)
    }
    & node @arguments | Out-Host
    $exitCode = $LASTEXITCODE
    $results = @()
    foreach ($stem in @('pairwise-summary', 'adv-cart-summary')) {
        $path = Join-Path $runDirectory "$stem.json"
        if (Test-Path -LiteralPath $path) { $results += @(Get-Content -Raw -Encoding UTF8 $path | ConvertFrom-Json | ForEach-Object { $_ }) }
    }
    $expectedCount = if ($CaseId) { $Repeat } else { $ids.Count * $Repeat }
    if ($results.Count -ne $expectedCount) { throw "Order-check discovery/report mismatch for ${Label}: expected $expectedCount, got $($results.Count). Exit $exitCode" }
    $runs.Add([pscustomobject]@{ label=$Label; exitCode=$exitCode; results=$results })
}
Push-Location $automationRoot
try {
    Invoke-CartRun 'default'
    foreach ($id in $ids) { Invoke-CartRun "isolated-$id" $id }
    $reverse = @($ids); [array]::Reverse($reverse)
    foreach ($id in $reverse) { Invoke-CartRun "reverse-$id" $id 2 }
    $random = [Random]::new($Seed)
    $shuffled = @($ids)
    for ($i = $shuffled.Length - 1; $i -gt 0; $i--) {
        $j = $random.Next($i + 1); $temp = $shuffled[$i]; $shuffled[$i] = $shuffled[$j]; $shuffled[$j] = $temp
    }
    foreach ($id in $shuffled) { Invoke-CartRun "seeded-$id" $id 2 }
    $baseline = @{}
    foreach ($result in $runs[0].results) { $baseline[$result.caseId] = "$($result.status)/$($result.classification)" }
    $differences = @($runs | ForEach-Object { $run = $_; $_.results | Where-Object { "$($_.status)/$($_.classification)" -ne $baseline[$_.caseId] } | ForEach-Object { "$($run.label): $($_.caseId) $($_.status)/$($_.classification) vs $($baseline[$_.caseId])" } })
    $allPassed = @($runs | ForEach-Object { $_.results } | Where-Object { $_.classification -ne 'PASSED' }).Count -eq 0 -and @($runs | Where-Object { $_.exitCode -ne 0 }).Count -eq 0
    $state = if ($differences.Count) { 'FAILED_ORDER_DEPENDENCE' } elseif ($allPassed) { 'PASSED' } else { 'NOT_PROVEN' }
    $receipt = [ordered]@{ runGroup=$runGroup; seed=$Seed; sourceCommit=(& git rev-parse HEAD); fixtureVersion='S2-ADV-CART-AUTO-v1'; status=$state; reverseOrder=$reverse; seededOrder=$shuffled; differences=$differences; runs=$runs }
    $receipt | ConvertTo-Json -Depth 30 | Set-Content -Encoding UTF8 (Join-Path $OutputDirectory 'order-check.json')
    @('# Cart order independence', '', "Status: $state; seed: $Seed", '', 'Default, isolated, reverse and seeded executions preserve each run and repeat result. Blocked runs do not prove independence.', '', ($differences -join "`n")) | Set-Content -Encoding UTF8 (Join-Path $OutputDirectory 'order-check.md')
    if ($state -ne 'PASSED') { exit 1 }
} finally {
    $env:QA_REPORT_DIR = $oldReportDir; $env:QA_ARTIFACT_DIR = $oldArtifactDir
    Pop-Location
}
