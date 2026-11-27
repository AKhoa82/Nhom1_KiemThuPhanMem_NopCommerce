[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$pairwise = Join-Path $root 'qa/pairwise'
$pict = Join-Path $pairwise 'tools/pict.exe'
if (-not (Test-Path -LiteralPath $pict)) { throw 'PICT is missing. Run install-pict.ps1 first.' }
$temporaryRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [System.IO.Path]::GetTempPath() }
$temporaryModel = Join-Path $temporaryRoot 'n04-model.pict'
Copy-Item -LiteralPath (Join-Path $pairwise 'model.pict') -Destination $temporaryModel -Force
try {
    foreach ($spec in @(
        @{ Name = 'pairwise-raw.tsv'; Args = @('/o:2', '/r:10380') },
        @{ Name = 'exhaustive-raw.tsv'; Args = @('/o:max') }
    )) {
        $actual = @(& $pict $temporaryModel @($spec.Args))
        if ($LASTEXITCODE -ne 0) { throw "PICT failed to generate $($spec.Name)." }
        $expected = @(Get-Content -LiteralPath (Join-Path $pairwise "test-data/$($spec.Name)"))
        while ($actual.Count -gt 1 -and $actual[-1] -eq '') { $actual = @($actual[0..($actual.Count - 2)]) }
        while ($expected.Count -gt 1 -and $expected[-1] -eq '') { $expected = @($expected[0..($expected.Count - 2)]) }
        if (($actual -join "`n") -cne ($expected -join "`n")) {
            $firstDifference = 0
            while ($firstDifference -lt [Math]::Min($actual.Count, $expected.Count) -and $actual[$firstDifference] -ceq $expected[$firstDifference]) {
                $firstDifference++
            }
            throw "PICT output differs from checked-in $($spec.Name) at line $($firstDifference + 1) (actual $($actual.Count), expected $($expected.Count)). Actual: '$($actual[$firstDifference])'; expected: '$($expected[$firstDifference])'."
        }
    }
    $receipt = [ordered]@{
        status = 'PASS'
        sourceSha = if ($env:GITHUB_SHA) { $env:GITHUB_SHA } else { 'LOCAL' }
        modelSha256 = (Get-FileHash -LiteralPath (Join-Path $pairwise 'model.pict') -Algorithm SHA256).Hash
        pictSha256 = (Get-FileHash -LiteralPath $pict -Algorithm SHA256).Hash
        pairwiseRowsSha256 = (Get-FileHash -LiteralPath (Join-Path $pairwise 'test-data/pairwise-raw.tsv') -Algorithm SHA256).Hash
        exhaustiveRowsSha256 = (Get-FileHash -LiteralPath (Join-Path $pairwise 'test-data/exhaustive-raw.tsv') -Algorithm SHA256).Hash
        expectedPairwiseRows = 14
        feasiblePairs = 253
    }
    $reportDirectory = Join-Path $root 'qa/ci/reports'
    New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
    $receipt | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $reportDirectory 'model-gate.json') -Encoding utf8
    Write-Host "N04_PAIRWISE_MODEL|PASS|sha256=$($receipt.modelSha256)"
} finally {
    Remove-Item -LiteralPath $temporaryModel -Force -ErrorAction SilentlyContinue
}
