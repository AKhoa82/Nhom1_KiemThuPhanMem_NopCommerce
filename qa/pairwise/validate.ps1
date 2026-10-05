[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$pairwiseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$modelPath = Join-Path $pairwiseRoot "model.pict"
$dataDirectory = Join-Path $pairwiseRoot "test-data"
$pairwisePath = Join-Path $dataDirectory "pairwise-raw.tsv"
$exhaustivePath = Join-Path $dataDirectory "exhaustive-raw.tsv"
$generatedCasesPath = Join-Path $dataDirectory "generated-cases.csv"
$coveragePath = Join-Path $dataDirectory "coverage-report.csv"
$summaryPath = Join-Path $dataDirectory "summary.md"

foreach ($requiredFile in @($modelPath, $pairwisePath, $exhaustivePath, $generatedCasesPath)) {
    if (-not (Test-Path -LiteralPath $requiredFile)) {
        throw "Required file not found: $requiredFile. Run generate.ps1 first."
    }
}

$pairwiseRows = @(Import-Csv -LiteralPath $pairwisePath -Delimiter "`t")
$exhaustiveRows = @(Import-Csv -LiteralPath $exhaustivePath -Delimiter "`t")
$generatedRows = @(Import-Csv -LiteralPath $generatedCasesPath)

if ($pairwiseRows.Count -eq 0 -or $exhaustiveRows.Count -eq 0) {
    throw "Pairwise or exhaustive output is empty."
}

$factorNames = @($pairwiseRows[0].PSObject.Properties.Name)
$exhaustiveFactorNames = @($exhaustiveRows[0].PSObject.Properties.Name)
if (($factorNames -join "|") -ne ($exhaustiveFactorNames -join "|")) {
    throw "Pairwise and exhaustive headers do not match."
}

function Get-RowSignature {
    param($Row, [string[]]$Factors)
    return (($Factors | ForEach-Object { [string]$Row.$_ }) -join [char]31)
}

function Add-RowPairs {
    param($Row, [string[]]$Factors, [System.Collections.Generic.HashSet[string]]$Set)
    for ($left = 0; $left -lt $Factors.Count; $left++) {
        for ($right = $left + 1; $right -lt $Factors.Count; $right++) {
            $key = @(
                $Factors[$left]
                [string]$Row.($Factors[$left])
                $Factors[$right]
                [string]$Row.($Factors[$right])
            ) -join [char]31
            [void]$Set.Add($key)
        }
    }
}

$errors = [System.Collections.Generic.List[string]]::new()
$exhaustiveSignatures = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($row in $exhaustiveRows) {
    [void]$exhaustiveSignatures.Add((Get-RowSignature -Row $row -Factors $factorNames))
}

for ($index = 0; $index -lt $pairwiseRows.Count; $index++) {
    $row = $pairwiseRows[$index]
    $caseId = "PW-{0:D3}" -f ($index + 1)
    $signature = Get-RowSignature -Row $row -Factors $factorNames

    if (-not $exhaustiveSignatures.Contains($signature)) {
        $errors.Add("$caseId is not present in the feasible exhaustive set.")
    }

    if ($row.CartAction -eq "Remove") {
        if ($row.InventoryState -ne "Sufficient" -or $row.Coupon -ne "None" -or
            $row.Address -ne "NA" -or $row.Shipping -ne "NA" -or $row.Payment -ne "NA") {
            $errors.Add("$caseId violates the Remove constraint.")
        }
    }

    if ($row.InventoryState -eq "OverLimit") {
        if ($row.CartAction -eq "Remove" -or $row.Address -ne "NA" -or
            $row.Shipping -ne "NA" -or $row.Payment -ne "NA") {
            $errors.Add("$caseId violates the OverLimit constraint.")
        }
    }

    if ($row.Address -eq "Valid") {
        if ($row.Shipping -ne "LocalAvailable" -or $row.Payment -ne "CheckMoneyOrder") {
            $errors.Add("$caseId violates the valid-address checkout constraint.")
        }
    }
    else {
        if ($row.Shipping -ne "NA" -or $row.Payment -ne "NA") {
            $errors.Add("$caseId continues checkout after an invalid or non-applicable address.")
        }
    }
}

if ($generatedRows.Count -ne $pairwiseRows.Count) {
    $errors.Add("generated-cases.csv has $($generatedRows.Count) rows but pairwise-raw.tsv has $($pairwiseRows.Count).")
}

$seenIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
for ($index = 0; $index -lt $generatedRows.Count; $index++) {
    $expectedId = "PW-{0:D3}" -f ($index + 1)
    $actualId = $generatedRows[$index].CaseId
    if ($actualId -ne $expectedId) {
        $errors.Add("Row $($index + 1) has CaseId '$actualId'; expected '$expectedId'.")
    }
    if (-not $seenIds.Add($actualId)) {
        $errors.Add("Duplicate CaseId: $actualId.")
    }

    foreach ($factor in $factorNames) {
        if ([string]$generatedRows[$index].$factor -ne [string]$pairwiseRows[$index].$factor) {
            $errors.Add("$expectedId differs between generated-cases.csv and pairwise-raw.tsv for factor '$factor'.")
        }
    }
}

$validPairs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$coveredPairs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($row in $exhaustiveRows) {
    Add-RowPairs -Row $row -Factors $factorNames -Set $validPairs
}
foreach ($row in $pairwiseRows) {
    Add-RowPairs -Row $row -Factors $factorNames -Set $coveredPairs
}

$coverageRows = foreach ($key in ($validPairs | Sort-Object)) {
    $parts = $key -split [char]31
    [PSCustomObject]@{
        Factor1 = $parts[0]
        Value1 = $parts[1]
        Factor2 = $parts[2]
        Value2 = $parts[3]
        Covered = $coveredPairs.Contains($key)
    }
}
$coverageRows | Export-Csv -LiteralPath $coveragePath -NoTypeInformation -Encoding UTF8

$coveredValidPairCount = @($validPairs | Where-Object { $coveredPairs.Contains($_) }).Count
$missingPairCount = $validPairs.Count - $coveredValidPairCount
$coveragePercent = if ($validPairs.Count -eq 0) { 100 } else { 100.0 * $coveredValidPairCount / $validPairs.Count }
if ($missingPairCount -gt 0) {
    $errors.Add("Pairwise output is missing $missingPairCount valid pairs.")
}

$rawExhaustive = [long]1
foreach ($line in Get-Content -LiteralPath $modelPath) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
        continue
    }
    if ($trimmed.StartsWith("IF ") -or $trimmed.StartsWith("[")) {
        break
    }
    $separator = $trimmed.IndexOf(":")
    if ($separator -gt 0) {
        $valueCount = ($trimmed.Substring($separator + 1).Split(",")).Count
        $rawExhaustive *= $valueCount
    }
}

$reducedCount = $exhaustiveRows.Count - $pairwiseRows.Count
$reductionPercent = if ($exhaustiveRows.Count -eq 0) { 0 } else { 100.0 * $reducedCount / $exhaustiveRows.Count }
$result = if ($errors.Count -eq 0) { "PASS" } else { "FAIL" }

@(
    "# T07 - Pairwise validation summary"
    ""
    "| Metric | Value |"
    "| --- | ---: |"
    "| Raw exhaustive before constraints | $rawExhaustive |"
    "| Feasible exhaustive after constraints | $($exhaustiveRows.Count) |"
    "| Pairwise test cases | $($pairwiseRows.Count) |"
    "| Reduced test cases | $reducedCount |"
    "| Reduction against feasible exhaustive | $($reductionPercent.ToString('F2'))% |"
    "| Total valid pairs | $($validPairs.Count) |"
    "| Covered valid pairs | $coveredValidPairCount |"
    "| Pair coverage | $($coveragePercent.ToString('F2'))% |"
    "| Validation result | $result |"
    ""
    "## Validation errors"
    ""
    $(if ($errors.Count -eq 0) { "None." } else { $errors | ForEach-Object { "- $_" } })
) | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host "Raw exhaustive: $rawExhaustive"
Write-Host "Feasible exhaustive: $($exhaustiveRows.Count)"
Write-Host "Pairwise cases: $($pairwiseRows.Count)"
Write-Host "Reduced cases: $reducedCount ($($reductionPercent.ToString('F2'))%)"
Write-Host "Pair coverage: $coveredValidPairCount/$($validPairs.Count) ($($coveragePercent.ToString('F2'))%)"
Write-Host "Validation result: $result"

if ($errors.Count -gt 0) {
    foreach ($validationError in $errors) {
        Write-Error $validationError
    }
    exit 1
}
