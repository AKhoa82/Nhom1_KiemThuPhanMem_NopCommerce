[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$pairwiseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$modelPath = Join-Path $pairwiseRoot "model.pict"
$generatedCasesPath = Join-Path $pairwiseRoot "generated-cases.csv"
$dataDirectory = Join-Path $pairwiseRoot "test-data"
$exhaustivePath = Join-Path $dataDirectory "exhaustive-raw.tsv"
$coveragePath = Join-Path $dataDirectory "coverage-report.csv"
$summaryPath = Join-Path $dataDirectory "summary.md"

foreach ($requiredFile in @($modelPath, $generatedCasesPath, $exhaustivePath)) {
    if (-not (Test-Path -LiteralPath $requiredFile)) {
        throw "Required file not found: $requiredFile. Run generate.ps1 first."
    }
}

$exhaustiveRows = @(Import-Csv -LiteralPath $exhaustivePath -Delimiter "`t")
$generatedRows = @(Import-Csv -LiteralPath $generatedCasesPath)

if ($exhaustiveRows.Count -eq 0 -or $generatedRows.Count -eq 0) {
    throw "Exhaustive or generated output is empty."
}

$pairwiseRows = $generatedRows
$factorNames = @($generatedRows[0].PSObject.Properties.Name)
$exhaustiveFactorNames = @($exhaustiveRows[0].PSObject.Properties.Name)
if (($factorNames -join "|") -ne ($exhaustiveFactorNames -join "|")) {
    throw "Headers do not match between exhaustive output and generated-cases.csv."
}

function Get-RowSignature {
    param($Row, [string[]]$Factors)
    return (($Factors | ForEach-Object { [string]$Row.$_ }) -join [char]31)
}

function Add-RowPairs {
    param(
        $Row,
        [string[]]$Factors,
        [System.Collections.Generic.HashSet[string]]$Set
    )

    for ($left = 0; $left -lt $Factors.Count - 1; $left++) {
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
    $caseId = "PW-{0:D3}" -f ($index + 1)
    $pairwiseSignature = Get-RowSignature -Row $generatedRows[$index] -Factors $factorNames
    if (-not $exhaustiveSignatures.Contains($pairwiseSignature)) {
        $errors.Add("$caseId is not present in the feasible exhaustive set.")
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
        Value1  = $parts[1]
        Factor2 = $parts[2]
        Value2  = $parts[3]
        Covered = $coveredPairs.Contains($key)
    }
}
$coverageRows | Export-Csv -LiteralPath $coveragePath -NoTypeInformation -Encoding UTF8

$coveredValidPairCount = @($validPairs | Where-Object { $coveredPairs.Contains($_) }).Count
$missingPairCount = $validPairs.Count - $coveredValidPairCount
$coveragePercent = if ($validPairs.Count -eq 0) { 100 } else { 100.0 * $coveredValidPairCount / $validPairs.Count }
if ($missingPairCount -gt 0) {
    $errors.Add("Pairwise output is missing $missingPairCount feasible pairs.")
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
    if ($trimmed -match '^[^:]+:\s*(.+)$') {
        $rawExhaustive *= ($matches[1].Split(",")).Count
    }
}

$invalidOutput = & (Join-Path $pairwiseRoot "validate-invalid-combinations.ps1") -CsvPath $generatedCasesPath 2>&1
$invalidExitCode = $LASTEXITCODE
$rowOutput = & (Join-Path $pairwiseRoot "validate-generated-rows.ps1") -ModelPath $modelPath -CsvPath $generatedCasesPath 2>&1
$rowExitCode = $LASTEXITCODE
$coverageOutput = & (Join-Path $pairwiseRoot "calculate-pairwise-coverage.ps1") -ModelPath $modelPath -CsvPath $generatedCasesPath 2>&1
$coverageExitCode = $LASTEXITCODE

$invalidOutput | Write-Output
$rowOutput | Write-Output
$coverageOutput | Write-Output

if ($invalidExitCode -ne 0) { $errors.Add("Invalid-combination validation failed.") }
if ($rowExitCode -ne 0) { $errors.Add("Generated-row validation failed.") }
if ($coverageExitCode -ne 0) { $errors.Add("Independent feasible-pair coverage validation failed.") }

$reducedCount = $exhaustiveRows.Count - $pairwiseRows.Count
$reductionPercent = if ($exhaustiveRows.Count -eq 0) { 0 } else { 100.0 * $reducedCount / $exhaustiveRows.Count }
$result = if ($errors.Count -eq 0) { "PASS" } else { "FAIL" }

@(
    "# T06/T07 - Pairwise validation summary"
    ""
    "| Metric | Value |"
    "| --- | ---: |"
    "| Factors | $($factorNames.Count) |"
    "| Raw exhaustive before constraints | $rawExhaustive |"
    "| Feasible exhaustive after constraints | $($exhaustiveRows.Count) |"
    "| Pairwise test cases | $($pairwiseRows.Count) |"
    "| Reduced test cases | $reducedCount |"
    "| Reduction against feasible exhaustive | $($reductionPercent.ToString('F2'))% |"
    "| Total feasible pairs | $($validPairs.Count) |"
    "| Covered feasible pairs | $coveredValidPairCount |"
    "| Pair coverage | $($coveragePercent.ToString('F2'))% |"
    "| Invalid-combination validation | $(if ($invalidExitCode -eq 0) { 'PASS' } else { 'FAIL' }) |"
    "| Row validation | $(if ($rowExitCode -eq 0) { 'PASS' } else { 'FAIL' }) |"
    "| Validation result | $result |"
    ""
    "## Validation errors"
    ""
    $(if ($errors.Count -eq 0) { "None." } else { $errors | ForEach-Object { "- $_" } })
) | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Output "Integrated T06/T07 validation"
Write-Output "Factors: $($factorNames.Count)"
Write-Output "Raw exhaustive: $rawExhaustive"
Write-Output "Feasible exhaustive: $($exhaustiveRows.Count)"
Write-Output "Pairwise cases: $($pairwiseRows.Count)"
Write-Output "Pair coverage: $coveredValidPairCount/$($validPairs.Count) ($($coveragePercent.ToString('F2'))%)"
Write-Output "Validation result: $result"

if ($errors.Count -gt 0) {
    foreach ($validationError in $errors) {
        Write-Error $validationError
    }
    exit 1
}

exit 0
