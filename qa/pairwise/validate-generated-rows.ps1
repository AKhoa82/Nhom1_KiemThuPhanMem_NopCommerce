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
    $CsvPath = Join-Path $pairwiseDirectory "generated-cases.csv"
}

$resolvedModelPath = (Resolve-Path -LiteralPath $ModelPath).Path
$resolvedCsvPath = (Resolve-Path -LiteralPath $CsvPath).Path

# Read parameter domains from the model. Parameter definitions precede all
# executable constraints in a PICT model.
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

$cases = @(Import-Csv -LiteralPath $resolvedCsvPath -Encoding utf8)
if ($cases.Count -eq 0) {
    throw "The generated cases file has no data rows: $resolvedCsvPath"
}

$expectedColumns = @($domains.Keys)
$actualColumns = @($cases[0].PSObject.Properties.Name)
$missingColumns = @($expectedColumns | Where-Object { $actualColumns -notcontains $_ })
$extraColumns = @($actualColumns | Where-Object { $expectedColumns -notcontains $_ })
if ($missingColumns.Count -gt 0 -or $extraColumns.Count -gt 0) {
    throw "CSV/model columns differ. Missing: $($missingColumns -join ', '); Extra: $($extraColumns -join ', ')"
}

# Conditional fixture/configuration decisions for this run.
$anonymousCheckoutAllowed = $true
$fakeDeclineProcessorAvailable = $false
$validCouponFixtureAvailable = $true
$multipleLinesFixtureAvailable = $true
$localShippingOption1Available = $true
$localSuccessPaymentAvailable = $true
$verifiedTrackedProductTypes = @("SimplePhysical", "ConfigurablePhysical")

$rowResults = [System.Collections.Generic.List[object]]::new()

for ($index = 0; $index -lt $cases.Count; $index++) {
    $case = $cases[$index]
    $caseId = "PW-{0:D3}" -f ($index + 1)
    $errors = [System.Collections.Generic.List[string]]::new()

    # Structural/domain validation.
    foreach ($column in $expectedColumns) {
        $value = [string]$case.$column
        if ([string]::IsNullOrWhiteSpace($value)) {
            $errors.Add("$column is blank")
        }
        elseif ($domains[$column] -notcontains $value) {
            $errors.Add("$column=$value is outside the model domain")
        }
    }

    # C01 - Guest depends on the fixed anonymous-checkout setting.
    if ($case.CustomerType -eq "Guest" -and -not $anonymousCheckoutAllowed) {
        $errors.Add("C01: Guest is not allowed while anonymous checkout is disabled")
    }

    # C02 - Stock boundary/error classes require tracked inventory.
    if ($case.QuantityClass -in @("AtAvailableLimit", "ExceedsAvailableStock") -and
        $verifiedTrackedProductTypes -notcontains $case.ProductType) {
        $errors.Add("C02: stock boundary/error quantity uses a non-tracked fixture")
    }

    # C03 - Out-of-stock and stock-failure flow.
    if ($case.InventoryState -eq "OutOfStock" -and
        $case.QuantityClass -ne "ExceedsAvailableStock") {
        $errors.Add("C03: OutOfStock does not use ExceedsAvailableStock")
    }
    if ($case.QuantityClass -eq "ExceedsAvailableStock" -and
        ($case.Address -ne "NA" -or
         $case.ShippingMethod -ne "NA" -or
         $case.PaymentMethod -ne "NA")) {
        $errors.Add("C03: stock failure continues to address/shipping/payment")
    }

    # C04 - Remove means deleting the final line and stopping checkout.
    if ($case.CartAction -eq "Remove" -and
        $case.CartComposition -ne "OneLine") {
        $errors.Add("C04: Remove is not limited to the final OneLine cart")
    }
    if ($case.CartAction -eq "Remove" -and
        ($case.Address -ne "NA" -or
         $case.ShippingMethod -ne "NA" -or
         $case.PaymentMethod -ne "NA")) {
        $errors.Add("C04: Remove continues to address/shipping/payment")
    }
    if ($case.CartAction -eq "Remove" -and
        $case.QuantityClass -eq "ExceedsAvailableStock") {
        $errors.Add("C04/C08: Remove is combined with a separate stock failure")
    }

    # C05 - Missing address data stops before shipping/payment.
    if ($case.Address -eq "MissingRequired" -and
        ($case.ShippingMethod -ne "NA" -or $case.PaymentMethod -ne "NA")) {
        $errors.Add("C05: MissingRequired continues to shipping/payment")
    }

    # C06 - Physical product flow and NA sequencing.
    if ($case.ShippingMethod -eq "NA" -and
        $case.CartAction -ne "Remove" -and
        $case.Address -ne "MissingRequired" -and
        $case.QuantityClass -ne "ExceedsAvailableStock") {
        $errors.Add("C06: ShippingMethod=NA has no earlier stopping reason")
    }
    if ($case.PaymentMethod -eq "NA" -and
        $case.CartAction -ne "Remove" -and
        $case.Address -ne "MissingRequired" -and
        $case.QuantityClass -ne "ExceedsAvailableStock") {
        $errors.Add("C06: PaymentMethod=NA has no earlier stopping reason")
    }
    if ($case.Address -eq "NA" -and
        $case.CartAction -ne "Remove" -and
        $case.QuantityClass -ne "ExceedsAvailableStock") {
        $errors.Add("C06: Address=NA has no pre-address stopping reason")
    }

    # C07 - Payment success requires a valid preceding flow. Decline remains
    # blocked because no verified fake local payment processor is available.
    if ($case.PaymentMethod -eq "LocalSuccess" -and
        ($case.CartAction -eq "Remove" -or
         $case.QuantityClass -eq "ExceedsAvailableStock" -or
         $case.Address -ne "Complete" -or
         $case.ShippingMethod -ne "LocalOption1")) {
        $errors.Add("C07: LocalSuccess does not have a valid preceding flow")
    }
    if ($case.PaymentMethod -eq "SimulatedDecline" -and
        -not $fakeDeclineProcessorAvailable) {
        $errors.Add("C07: SimulatedDecline is present without a fake processor")
    }

    # C08 - Only one primary blocker per negative row.
    $primaryBlockers = [System.Collections.Generic.List[string]]::new()
    if ($case.QuantityClass -eq "ExceedsAvailableStock") { $primaryBlockers.Add("Stock") }
    if ($case.Address -eq "MissingRequired") { $primaryBlockers.Add("Address") }
    if ($case.PaymentMethod -eq "SimulatedDecline") { $primaryBlockers.Add("Payment") }
    if ($primaryBlockers.Count -gt 1) {
        $errors.Add("C08: multiple primary blockers: $($primaryBlockers -join '+')")
    }

    # C09 intentionally adds no NA relationship for Coupon=Invalid.

    # Conditional fixture availability.
    if ($case.Coupon -eq "Valid" -and -not $validCouponFixtureAvailable) {
        $errors.Add("Fixture: valid coupon is unavailable")
    }
    if ($case.CartComposition -eq "MultipleLines" -and -not $multipleLinesFixtureAvailable) {
        $errors.Add("Fixture: multiple-line cart is unavailable")
    }
    if ($case.ShippingMethod -eq "LocalOption1" -and -not $localShippingOption1Available) {
        $errors.Add("Fixture: LocalOption1 is unavailable")
    }
    if ($case.PaymentMethod -eq "LocalSuccess" -and -not $localSuccessPaymentAvailable) {
        $errors.Add("Fixture: LocalSuccess payment is unavailable")
    }

    $blockerLabel = if ($primaryBlockers.Count -eq 0) {
        "None"
    }
    else {
        $primaryBlockers -join "+"
    }

    $rowResults.Add([pscustomobject]@{
        CaseId  = $caseId
        Result  = if ($errors.Count -eq 0) { "PASS" } else { "FAIL" }
        Blocker = $blockerLabel
        Details = if ($errors.Count -eq 0) { "OK" } else { $errors -join "; " }
    })
}

$validRows = @($rowResults | Where-Object { $_.Result -eq "PASS" }).Count
$invalidRows = $rowResults.Count - $validRows

Write-Output "Pairwise row validation"
Write-Output "Model: $resolvedModelPath"
Write-Output "Input: $resolvedCsvPath"
Write-Output "Expected columns: $($expectedColumns.Count)"
Write-Output "Actual columns: $($actualColumns.Count)"
Write-Output ""
$rowResults | Format-Table CaseId, Result, Blocker, Details -AutoSize -Wrap
Write-Output "Total rows: $($rowResults.Count)"
Write-Output "Valid rows: $validRows"
Write-Output "Invalid rows: $invalidRows"

if ($invalidRows -gt 0) {
    Write-Output "Overall result: FAIL"
    exit 1
}

Write-Output "Overall result: PASS"
exit 0
