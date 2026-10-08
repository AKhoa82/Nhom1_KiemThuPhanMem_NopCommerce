param(
    [string]$CsvPath = ""
)

$ErrorActionPreference = "Stop"

$pairwiseDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($CsvPath)) {
    $CsvPath = Join-Path $pairwiseDirectory "test-data\generated-cases.csv"
}

$resolvedCsvPath = (Resolve-Path -LiteralPath $CsvPath).Path
$cases = @(Import-Csv -LiteralPath $resolvedCsvPath -Encoding utf8)

if ($cases.Count -eq 0) {
    throw "The generated cases file has no data rows: $resolvedCsvPath"
}

$requiredColumns = @(
    "CaseId",
    "CustomerType",
    "ProductType",
    "CartComposition",
    "QuantityClass",
    "InventoryState",
    "Coupon",
    "Address",
    "ShippingMethod",
    "PaymentMethod",
    "CartAction"
)

$actualColumns = @($cases[0].PSObject.Properties.Name)
$missingColumns = @($requiredColumns | Where-Object { $actualColumns -notcontains $_ })
if ($missingColumns.Count -gt 0) {
    throw "Missing required columns: $($missingColumns -join ', ')"
}

# Environment/fixture decisions verified by the evidence for this run.
$anonymousCheckoutAllowed = $true
$fakeDeclineProcessorAvailable = $false
$verifiedTrackedProductTypes = @("SimplePhysical", "ConfigurablePhysical")

$indexedCases = for ($index = 0; $index -lt $cases.Count; $index++) {
    [pscustomobject]@{
        CaseId = [string]$cases[$index].CaseId
        Data   = $cases[$index]
    }
}

function Get-SampleIds {
    param([array]$Violations)

    if ($Violations.Count -eq 0) {
        return "-"
    }

    return (($Violations | Select-Object -First 5 -ExpandProperty CaseId) -join ",")
}

$results = [System.Collections.Generic.List[object]]::new()

# INV-01: Guest is invalid only when anonymous checkout is disabled.
$inv01 = @($indexedCases | Where-Object {
    -not $anonymousCheckoutAllowed -and $_.Data.CustomerType -eq "Guest"
})
$results.Add([pscustomobject]@{
    Rule       = "INV-01"
    Status     = if ($anonymousCheckoutAllowed) { "N/A" } elseif ($inv01.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv01.Count
    SampleIds  = Get-SampleIds $inv01
    Note       = "Anonymous checkout is enabled; Guest is included."
})

# INV-02: Stock boundary/over-stock values require a tracked-inventory fixture.
$inv02 = @($indexedCases | Where-Object {
    $_.Data.QuantityClass -in @("AtAvailableLimit", "ExceedsAvailableStock") -and
    $verifiedTrackedProductTypes -notcontains $_.Data.ProductType
})
$results.Add([pscustomobject]@{
    Rule       = "INV-02"
    Status     = if ($inv02.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv02.Count
    SampleIds  = Get-SampleIds $inv02
    Note       = "Both declared ProductType fixtures track inventory."
})

# INV-03: OutOfStock must use ExceedsAvailableStock.
$inv03 = @($indexedCases | Where-Object {
    $_.Data.InventoryState -eq "OutOfStock" -and
    $_.Data.QuantityClass -ne "ExceedsAvailableStock"
})
$results.Add([pscustomobject]@{
    Rule       = "INV-03"
    Status     = if ($inv03.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv03.Count
    SampleIds  = Get-SampleIds $inv03
    Note       = "OutOfStock must map to ExceedsAvailableStock."
})

# INV-04: Removing the final line requires OneLine and stops before checkout.
$inv04 = @($indexedCases | Where-Object {
    $_.Data.CartAction -eq "Remove" -and
    ($_.Data.CartComposition -ne "OneLine" -or
     $_.Data.Address -ne "NA" -or
     $_.Data.ShippingMethod -ne "NA" -or
     $_.Data.PaymentMethod -ne "NA")
})
$results.Add([pscustomobject]@{
    Rule       = "INV-04"
    Status     = if ($inv04.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv04.Count
    SampleIds  = Get-SampleIds $inv04
    Note       = "Remove requires OneLine and Address, ShippingMethod, PaymentMethod set to NA."
})

# INV-05: MissingRequired must stop before shipping/payment.
$inv05 = @($indexedCases | Where-Object {
    $_.Data.Address -eq "MissingRequired" -and
    ($_.Data.ShippingMethod -ne "NA" -or
     $_.Data.PaymentMethod -ne "NA")
})
$results.Add([pscustomobject]@{
    Rule       = "INV-05"
    Status     = if ($inv05.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv05.Count
    SampleIds  = Get-SampleIds $inv05
    Note       = "MissingRequired requires ShippingMethod and PaymentMethod to be NA."
})

# INV-06: Payment state must agree with the verified checkout path.
$inv06 = @($indexedCases | Where-Object {
    ($_.Data.PaymentMethod -eq "LocalSuccess" -and
     $_.Data.ShippingMethod -eq "NA") -or
    ($_.Data.PaymentMethod -eq "NA" -and
     $_.Data.CartAction -ne "Remove" -and
     $_.Data.Address -ne "MissingRequired" -and
     $_.Data.QuantityClass -ne "ExceedsAvailableStock")
})
$results.Add([pscustomobject]@{
    Rule       = "INV-06"
    Status     = if ($inv06.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv06.Count
    SampleIds  = Get-SampleIds $inv06
    Note       = "LocalSuccess requires LocalOption1; NA requires an earlier stopping reason."
})

# INV-07: SimulatedDecline is blocked while no fake local processor exists.
$inv07 = @($indexedCases | Where-Object {
    -not $fakeDeclineProcessorAvailable -and
    $_.Data.PaymentMethod -eq "SimulatedDecline"
})
$results.Add([pscustomobject]@{
    Rule       = "INV-07"
    Status     = if (-not $fakeDeclineProcessorAvailable -and $inv07.Count -eq 0) { "N/A" } elseif ($inv07.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv07.Count
    SampleIds  = Get-SampleIds $inv07
    Note       = "SimulatedDecline is blocked and absent; no verified fake local processor."
})

# INV-08: A row may contain at most one primary blocker.
$inv08 = @($indexedCases | Where-Object {
    $blockerCount = 0
    if ($_.Data.QuantityClass -eq "ExceedsAvailableStock") { $blockerCount++ }
    if ($_.Data.Address -eq "MissingRequired") { $blockerCount++ }
    if ($_.Data.PaymentMethod -eq "SimulatedDecline") { $blockerCount++ }
    $blockerCount -gt 1
})
$results.Add([pscustomobject]@{
    Rule       = "INV-08"
    Status     = if ($inv08.Count -eq 0) { "PASS" } else { "FAIL" }
    Violations = $inv08.Count
    SampleIds  = Get-SampleIds $inv08
    Note       = "Primary blockers: stock, missing address, or payment decline."
})

$totalViolations = ($results | Measure-Object -Property Violations -Sum).Sum

Write-Output "Pairwise invalid-combination validation"
Write-Output "Input: $resolvedCsvPath"
Write-Output "Total rows checked: $($cases.Count)"
Write-Output "Anonymous checkout allowed: $anonymousCheckoutAllowed"
Write-Output "Fake decline processor available: $fakeDeclineProcessorAvailable"
Write-Output ""
$results | Format-Table Rule, Status, Violations, SampleIds, Note -AutoSize -Wrap
Write-Output "Total violations: $totalViolations"

if ($totalViolations -gt 0) {
    Write-Output "Overall result: FAIL"
    exit 1
}

Write-Output "Overall result: PASS"
exit 0
