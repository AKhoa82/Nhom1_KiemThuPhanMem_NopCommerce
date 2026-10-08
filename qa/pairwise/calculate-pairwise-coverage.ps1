param(
    [string]$ModelPath = "",
    [string]$CsvPath = ""
)

$ErrorActionPreference = "Stop"

$pairwiseDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($ModelPath)) {
    $ModelPath = Join-Path $pairwiseDirectory "model.pict"
}
if ([string]::IsNullOrWhiteSpace($CsvPath)) {
    $CsvPath = Join-Path $pairwiseDirectory "test-data\generated-cases.csv"
}

$resolvedModelPath = (Resolve-Path -LiteralPath $ModelPath).Path
$resolvedCsvPath = (Resolve-Path -LiteralPath $CsvPath).Path

# Read parameter domains from the PICT model.
$domains = [ordered]@{}
foreach ($line in Get-Content -LiteralPath $resolvedModelPath -Encoding utf8) {
    $trimmedLine = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmedLine) -or $trimmedLine.StartsWith("#")) {
        continue
    }
    if ($trimmedLine.StartsWith("IF ") -or $trimmedLine.StartsWith("[")) {
        break
    }
    if ($trimmedLine -match '^([^:]+):\s*(.+)$') {
        $parameterName = $matches[1].Trim()
        $parameterValues = @($matches[2].Split(',') | ForEach-Object { $_.Trim() })
        $domains[$parameterName] = $parameterValues
    }
}

if ($domains.Count -eq 0) {
    throw "No parameter domains were found in model: $resolvedModelPath"
}

$factors = @($domains.Keys)
$cases = @(Import-Csv -LiteralPath $resolvedCsvPath -Encoding utf8)
if ($cases.Count -eq 0) {
    throw "The generated cases file has no data rows: $resolvedCsvPath"
}

$actualColumns = @($cases[0].PSObject.Properties.Name)
$requiredColumns = @("CaseId") + $factors
$missingColumns = @($requiredColumns | Where-Object { $actualColumns -notcontains $_ })
$extraColumns = @($actualColumns | Where-Object { $requiredColumns -notcontains $_ })
if ($missingColumns.Count -gt 0 -or $extraColumns.Count -gt 0) {
    throw "CSV/model columns differ. Missing: $($missingColumns -join ', '); Extra: $($extraColumns -join ', ')"
}

# Fixed environment/fixture decisions for this run.
$anonymousCheckoutAllowed = $true
$fakeDeclineProcessorAvailable = $false
$verifiedTrackedProductTypes = @("SimplePhysical", "ConfigurablePhysical")

function Test-FeasibleAssignment {
    param([hashtable]$Assignment)

    # Every value must belong to its declared domain.
    foreach ($factor in $factors) {
        if (-not $Assignment.ContainsKey($factor) -or
            $domains[$factor] -notcontains [string]$Assignment[$factor]) {
            return $false
        }
    }

    # C01 - Guest checkout depends on the fixed setting.
    if ($Assignment.CustomerType -eq "Guest" -and -not $anonymousCheckoutAllowed) {
        return $false
    }

    # C02 - Stock boundary/error classes require tracked inventory.
    if ($Assignment.QuantityClass -in @("AtAvailableLimit", "ExceedsAvailableStock") -and
        $verifiedTrackedProductTypes -notcontains $Assignment.ProductType) {
        return $false
    }

    # C03 - Out-of-stock and stock-failure stopping flow.
    if ($Assignment.InventoryState -eq "OutOfStock" -and
        $Assignment.QuantityClass -ne "ExceedsAvailableStock") {
        return $false
    }
    if ($Assignment.QuantityClass -eq "ExceedsAvailableStock" -and
        ($Assignment.Address -ne "NA" -or
         $Assignment.ShippingMethod -ne "NA" -or
         $Assignment.PaymentMethod -ne "NA")) {
        return $false
    }

    # C04 - Remove means deleting the final line and stopping checkout.
    if ($Assignment.CartAction -eq "Remove" -and
        $Assignment.CartComposition -ne "OneLine") {
        return $false
    }
    if ($Assignment.CartAction -eq "Remove" -and
        ($Assignment.Address -ne "NA" -or
         $Assignment.ShippingMethod -ne "NA" -or
         $Assignment.PaymentMethod -ne "NA")) {
        return $false
    }
    if ($Assignment.CartAction -eq "Remove" -and
        $Assignment.QuantityClass -eq "ExceedsAvailableStock") {
        return $false
    }

    # C05 - Missing address data stops before shipping/payment.
    if ($Assignment.Address -eq "MissingRequired" -and
        ($Assignment.ShippingMethod -ne "NA" -or
         $Assignment.PaymentMethod -ne "NA")) {
        return $false
    }

    # C06 - NA is valid only after an earlier stopping reason.
    if ($Assignment.ShippingMethod -eq "NA" -and
        $Assignment.CartAction -ne "Remove" -and
        $Assignment.Address -ne "MissingRequired" -and
        $Assignment.QuantityClass -ne "ExceedsAvailableStock") {
        return $false
    }
    if ($Assignment.PaymentMethod -eq "NA" -and
        $Assignment.CartAction -ne "Remove" -and
        $Assignment.Address -ne "MissingRequired" -and
        $Assignment.QuantityClass -ne "ExceedsAvailableStock") {
        return $false
    }
    if ($Assignment.Address -eq "NA" -and
        $Assignment.CartAction -ne "Remove" -and
        $Assignment.QuantityClass -ne "ExceedsAvailableStock") {
        return $false
    }

    # C07 - Payment success requires a valid preceding flow. Decline is blocked.
    if ($Assignment.PaymentMethod -eq "LocalSuccess" -and
        ($Assignment.CartAction -eq "Remove" -or
         $Assignment.QuantityClass -eq "ExceedsAvailableStock" -or
         $Assignment.Address -ne "Complete" -or
         $Assignment.ShippingMethod -ne "LocalOption1")) {
        return $false
    }
    if ($Assignment.PaymentMethod -eq "SimulatedDecline" -and
        -not $fakeDeclineProcessorAvailable) {
        return $false
    }

    # C08 - At most one primary blocker.
    $blockerCount = 0
    if ($Assignment.QuantityClass -eq "ExceedsAvailableStock") { $blockerCount++ }
    if ($Assignment.Address -eq "MissingRequired") { $blockerCount++ }
    if ($Assignment.PaymentMethod -eq "SimulatedDecline") { $blockerCount++ }
    if ($blockerCount -gt 1) {
        return $false
    }

    # C09 intentionally adds no relationship for Coupon=Invalid.
    return $true
}

function Get-PairKey {
    param(
        [string]$FactorA,
        [string]$ValueA,
        [string]$FactorB,
        [string]$ValueB
    )

    return "$FactorA=$ValueA <> $FactorB=$ValueB"
}

$feasiblePairs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$actualPairs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$script:feasibleAssignmentCount = 0

function Add-FeasibleAssignments {
    param(
        [int]$FactorIndex,
        [hashtable]$CurrentAssignment
    )

    if ($FactorIndex -eq $factors.Count) {
        if (Test-FeasibleAssignment $CurrentAssignment) {
            $script:feasibleAssignmentCount++
            for ($left = 0; $left -lt $factors.Count - 1; $left++) {
                for ($right = $left + 1; $right -lt $factors.Count; $right++) {
                    $factorA = $factors[$left]
                    $factorB = $factors[$right]
                    $key = Get-PairKey $factorA ([string]$CurrentAssignment[$factorA]) $factorB ([string]$CurrentAssignment[$factorB])
                    [void]$feasiblePairs.Add($key)
                }
            }
        }
        return
    }

    $factor = $factors[$FactorIndex]
    foreach ($value in $domains[$factor]) {
        $nextAssignment = @{}
        foreach ($existingKey in $CurrentAssignment.Keys) {
            $nextAssignment[$existingKey] = $CurrentAssignment[$existingKey]
        }
        $nextAssignment[$factor] = $value
        Add-FeasibleAssignments ($FactorIndex + 1) $nextAssignment
    }
}

# Calculate every pair that can be extended to at least one valid full assignment.
Add-FeasibleAssignments 0 @{}

# Collect pairs covered by the generated rows, rejecting any infeasible row.
$infeasibleGeneratedRows = [System.Collections.Generic.List[string]]::new()
for ($rowIndex = 0; $rowIndex -lt $cases.Count; $rowIndex++) {
    $case = $cases[$rowIndex]
    $assignment = @{}
    foreach ($factor in $factors) {
        $assignment[$factor] = [string]$case.$factor
    }

    if (-not (Test-FeasibleAssignment $assignment)) {
        $infeasibleGeneratedRows.Add([string]$case.CaseId)
        continue
    }

    for ($left = 0; $left -lt $factors.Count - 1; $left++) {
        for ($right = $left + 1; $right -lt $factors.Count; $right++) {
            $factorA = $factors[$left]
            $factorB = $factors[$right]
            $key = Get-PairKey $factorA ([string]$assignment[$factorA]) $factorB ([string]$assignment[$factorB])
            [void]$actualPairs.Add($key)
        }
    }
}

$missingFeasiblePairs = @($feasiblePairs | Where-Object { -not $actualPairs.Contains($_) } | Sort-Object)
$coveredFeasiblePairs = @($feasiblePairs | Where-Object { $actualPairs.Contains($_) }).Count
$unexpectedActualPairs = @($actualPairs | Where-Object { -not $feasiblePairs.Contains($_) } | Sort-Object)

$rawCandidatePairs = 0
$rawFullAssignments = 1
foreach ($factor in $factors) {
    $rawFullAssignments *= $domains[$factor].Count
}
for ($left = 0; $left -lt $factors.Count - 1; $left++) {
    for ($right = $left + 1; $right -lt $factors.Count; $right++) {
        $rawCandidatePairs += $domains[$factors[$left]].Count * $domains[$factors[$right]].Count
    }
}

$coverage = if ($feasiblePairs.Count -eq 0) {
    0
}
else {
    [math]::Round(($coveredFeasiblePairs / $feasiblePairs.Count) * 100, 2)
}

Write-Output "Feasible-pair coverage"
Write-Output "Model: $resolvedModelPath"
Write-Output "Input: $resolvedCsvPath"
Write-Output "Factors: $($factors.Count)"
Write-Output "Generated tests: $($cases.Count)"
Write-Output "Raw full assignments before constraints: $rawFullAssignments"
Write-Output "Raw candidate pairs before constraints: $rawCandidatePairs"
Write-Output "Feasible full assignments: $script:feasibleAssignmentCount"
Write-Output "Total feasible pairs: $($feasiblePairs.Count)"
Write-Output "Covered feasible pairs: $coveredFeasiblePairs"
Write-Output "Missing feasible pairs: $($missingFeasiblePairs.Count)"
Write-Output "Unexpected actual pairs: $($unexpectedActualPairs.Count)"
Write-Output "Infeasible generated rows: $($infeasibleGeneratedRows.Count)"
Write-Output ("Coverage: {0}/{1} = {2}%" -f $coveredFeasiblePairs, $feasiblePairs.Count, $coverage)

if ($missingFeasiblePairs.Count -gt 0) {
    Write-Output "Missing pair list:"
    $missingFeasiblePairs | ForEach-Object { Write-Output "- $_" }
}
if ($unexpectedActualPairs.Count -gt 0) {
    Write-Output "Unexpected actual pair list:"
    $unexpectedActualPairs | ForEach-Object { Write-Output "- $_" }
}
if ($infeasibleGeneratedRows.Count -gt 0) {
    Write-Output "Infeasible generated row IDs: $($infeasibleGeneratedRows -join ',')"
}

if ($missingFeasiblePairs.Count -gt 0 -or
    $unexpectedActualPairs.Count -gt 0 -or
    $infeasibleGeneratedRows.Count -gt 0 -or
    $coverage -ne 100) {
    Write-Output "Overall result: FAIL"
    exit 1
}

Write-Output "Overall result: PASS"
exit 0
