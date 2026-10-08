[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$pairwiseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$modelPath = Join-Path $pairwiseRoot "model.pict"
$dataDirectory = Join-Path $pairwiseRoot "test-data"
$pairwisePath = Join-Path $dataDirectory "pairwise-raw.tsv"
$exhaustivePath = Join-Path $dataDirectory "exhaustive-raw.tsv"
$generatedCasesPath = Join-Path $dataDirectory "generated-cases.csv"
$mappingPath = Join-Path $dataDirectory "scenario-mapping.csv"
$coveragePath = Join-Path $dataDirectory "coverage-report.csv"
$summaryPath = Join-Path $dataDirectory "summary.md"

foreach ($requiredFile in @($modelPath, $pairwisePath, $exhaustivePath, $generatedCasesPath, $mappingPath)) {
    if (-not (Test-Path -LiteralPath $requiredFile)) {
        throw "Required file not found: $requiredFile. Run generate.ps1 first."
    }
}

$pairwiseRows = @(Import-Csv -LiteralPath $pairwisePath -Delimiter "`t")
$exhaustiveRows = @(Import-Csv -LiteralPath $exhaustivePath -Delimiter "`t")
$generatedRows = @(Import-Csv -LiteralPath $generatedCasesPath)
$mappingRows = @(Import-Csv -LiteralPath $mappingPath)

if ($pairwiseRows.Count -eq 0 -or $exhaustiveRows.Count -eq 0 -or $generatedRows.Count -eq 0) {
    throw "Pairwise, exhaustive, or generated output is empty."
}

$factorNames = @($pairwiseRows[0].PSObject.Properties.Name)
$exhaustiveFactorNames = @($exhaustiveRows[0].PSObject.Properties.Name)
if (($factorNames -join "|") -ne ($exhaustiveFactorNames -join "|")) {
    throw "Pairwise and exhaustive headers do not match."
}

$expectedGeneratedColumns = @("CaseId") + $factorNames
$actualGeneratedColumns = @($generatedRows[0].PSObject.Properties.Name)
if (($actualGeneratedColumns -join "|") -ne ($expectedGeneratedColumns -join "|")) {
    throw "Generated CSV columns must be CaseId followed by the PICT factor columns."
}

function Get-RowSignature {
    param($Row, [string[]]$Factors)
    return (($Factors | ForEach-Object { [string]$Row.$_ }) -join [char]31)
}

function Add-RowPairs {
    param($Row, [string[]]$Factors, [System.Collections.Generic.HashSet[string]]$Set)
    for ($left = 0; $left -lt $Factors.Count - 1; $left++) {
        for ($right = $left + 1; $right -lt $Factors.Count; $right++) {
            $key = @($Factors[$left], [string]$Row.($Factors[$left]), $Factors[$right], [string]$Row.($Factors[$right])) -join [char]31
            [void]$Set.Add($key)
        }
    }
}

$errors = [System.Collections.Generic.List[string]]::new()
$exhaustiveSignatures = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($row in $exhaustiveRows) { [void]$exhaustiveSignatures.Add((Get-RowSignature $row $factorNames)) }

$seenCaseIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
for ($index = 0; $index -lt $generatedRows.Count; $index++) {
    $expectedId = "PW-{0:D3}" -f ($index + 1)
    $actualId = [string]$generatedRows[$index].CaseId
    if ($actualId -ne $expectedId) { $errors.Add("Generated row $($index + 1) has CaseId '$actualId'; expected '$expectedId'.") }
    if (-not $seenCaseIds.Add($actualId)) { $errors.Add("Duplicate generated CaseId: $actualId") }
    if ($index -ge $pairwiseRows.Count) { continue }
    if ((Get-RowSignature $generatedRows[$index] $factorNames) -ne (Get-RowSignature $pairwiseRows[$index] $factorNames)) {
        $errors.Add("$expectedId differs between generated-cases.csv and pairwise-raw.tsv.")
    }
    if (-not $exhaustiveSignatures.Contains((Get-RowSignature $generatedRows[$index] $factorNames))) {
        $errors.Add("$expectedId is not present in the feasible exhaustive set.")
    }
}
if ($generatedRows.Count -ne $pairwiseRows.Count) { $errors.Add("Generated row count does not match pairwise raw row count.") }

$mappingIds = @($mappingRows | ForEach-Object { [string]$_.CaseId })
if ($mappingRows.Count -ne $generatedRows.Count) { $errors.Add("Scenario mapping row count does not equal generated row count.") }
if (($mappingIds -join "|") -ne (@($generatedRows | ForEach-Object { [string]$_.CaseId }) -join "|")) {
    $errors.Add("Scenario mapping CaseId sequence is not a 1-to-1 match with generated-cases.csv.")
}
if (@($mappingRows | Where-Object { $_.MappingStatus -ne "Mapped" }).Count -gt 0) {
    $errors.Add("Every scenario mapping row must have MappingStatus=Mapped.")
}

$validPairs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$coveredPairs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($row in $exhaustiveRows) { Add-RowPairs $row $factorNames $validPairs }
foreach ($row in $pairwiseRows) { Add-RowPairs $row $factorNames $coveredPairs }
$coverageRows = foreach ($key in ($validPairs | Sort-Object)) {
    $parts = $key -split [char]31
    [PSCustomObject]@{ Factor1 = $parts[0]; Value1 = $parts[1]; Factor2 = $parts[2]; Value2 = $parts[3]; Covered = $coveredPairs.Contains($key) }
}
$coverageRows | Export-Csv -LiteralPath $coveragePath -NoTypeInformation -Encoding UTF8
$coveredValidPairCount = @($validPairs | Where-Object { $coveredPairs.Contains($_) }).Count
$missingPairCount = $validPairs.Count - $coveredValidPairCount
if ($missingPairCount -gt 0) { $errors.Add("Pairwise output is missing $missingPairCount feasible pairs.") }

$rawExhaustive = [long]1
foreach ($line in Get-Content -LiteralPath $modelPath) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) { continue }
    if ($trimmed.StartsWith("IF ") -or $trimmed.StartsWith("[")) { break }
    if ($trimmed -match '^[^:]+:\s*(.+)$') { $rawExhaustive *= $matches[1].Split(',').Count }
}
$reducedCount = $exhaustiveRows.Count - $pairwiseRows.Count
$reductionPercent = if ($exhaustiveRows.Count -eq 0) { 0 } else { 100.0 * $reducedCount / $exhaustiveRows.Count }
$invariantCulture = [System.Globalization.CultureInfo]::InvariantCulture
$formattedReductionPercent = $reductionPercent.ToString("F2", $invariantCulture)
$formattedPairCoveragePercent = (100.0 * $coveredValidPairCount / $validPairs.Count).ToString("F2", $invariantCulture)
$result = if ($errors.Count -eq 0) { "PASS" } else { "FAIL" }

@(
    "# T07 - Pairwise validation summary"
    ""
    "| Metric | Value |"
    "| --- | ---: |"
    "| Raw exhaustive before constraints | $rawExhaustive |"
    "| Feasible exhaustive after constraints | $($exhaustiveRows.Count) |"
    "| Pairwise test cases | $($pairwiseRows.Count) |"
    "| Generated CSV CaseId rows | $($generatedRows.Count) |"
    "| Scenario mapping rows | $($mappingRows.Count) |"
    "| Reduced test cases | $reducedCount |"
    "| Reduction against feasible exhaustive | $formattedReductionPercent% |"
    "| Total feasible pairs | $($validPairs.Count) |"
    "| Covered feasible pairs | $coveredValidPairCount |"
    "| Pair coverage | $formattedPairCoveragePercent% |"
    "| CaseId-to-mapping linkage | $(if ($errors -notcontains 'Scenario mapping CaseId sequence is not a 1-to-1 match with generated-cases.csv.') { 'PASS' } else { 'FAIL' }) |"
    "| Validation result | $result |"
    ""
    "## Validation errors"
    ""
    $(if ($errors.Count -eq 0) { "None." } else { $errors | ForEach-Object { "- $_" } })
) | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host "Raw exhaustive: $rawExhaustive"
Write-Host "Feasible exhaustive: $($exhaustiveRows.Count)"
Write-Host "Pairwise cases: $($pairwiseRows.Count)"
Write-Host "CaseId-to-mapping rows: $($mappingRows.Count)"
Write-Host "Pair coverage: $coveredValidPairCount/$($validPairs.Count)"
Write-Host "Validation result: $result"

if ($errors.Count -gt 0) { $errors | ForEach-Object { Write-Error $_ }; exit 1 }
