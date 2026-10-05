[CmdletBinding()]
param(
    [ValidateRange(0, 32767)]
    [int]$Seed = 10380,
    [string]$PictPath
)

$ErrorActionPreference = "Stop"

$pairwiseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = (Resolve-Path (Join-Path $pairwiseRoot "..\..")).Path
$modelPath = Join-Path $pairwiseRoot "model.pict"
$dataDirectory = Join-Path $pairwiseRoot "test-data"

if ([string]::IsNullOrWhiteSpace($PictPath)) {
    $PictPath = Join-Path $pairwiseRoot "tools\pict.exe"
}

if (-not (Test-Path -LiteralPath $PictPath)) {
    throw "PICT was not found at '$PictPath'. Run qa\pairwise\install-pict.ps1 first or pass -PictPath."
}

if (-not (Test-Path -LiteralPath $modelPath)) {
    throw "Model not found: $modelPath"
}

New-Item -ItemType Directory -Force -Path $dataDirectory | Out-Null

$pairwiseTemp = Join-Path $dataDirectory "pairwise-raw.tsv.tmp"
$pairwiseErrorTemp = Join-Path $dataDirectory "pairwise.stderr.tmp"
$exhaustiveTemp = Join-Path $dataDirectory "exhaustive-raw.tsv.tmp"
$exhaustiveErrorTemp = Join-Path $dataDirectory "exhaustive.stderr.tmp"

$pairwisePath = Join-Path $dataDirectory "pairwise-raw.tsv"
$exhaustivePath = Join-Path $dataDirectory "exhaustive-raw.tsv"
$generatedCasesPath = Join-Path $dataDirectory "generated-cases.csv"
$logPath = Join-Path $dataDirectory "generation.log"

function Invoke-PictProcess {
    param(
        [string]$Executable,
        [string]$Arguments,
        [string]$StandardOutputPath,
        [string]$StandardErrorPath
    )

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $Executable
    $startInfo.Arguments = $Arguments
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $standardOutputTask = $process.StandardOutput.ReadToEndAsync()
    $standardErrorTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $standardOutputTask.Result | Set-Content -LiteralPath $StandardOutputPath -Encoding UTF8
    $standardErrorTask.Result | Set-Content -LiteralPath $StandardErrorPath -Encoding UTF8

    return $process.ExitCode
}

try {
    $pairwiseExitCode = Invoke-PictProcess `
        -Executable $PictPath `
        -Arguments "`"$modelPath`" /o:2 /r:$Seed" `
        -StandardOutputPath $pairwiseTemp `
        -StandardErrorPath $pairwiseErrorTemp
    if ($pairwiseExitCode -ne 0) {
        $details = Get-Content -LiteralPath $pairwiseErrorTemp -Raw -ErrorAction SilentlyContinue
        throw "PICT pairwise generation failed with exit code $pairwiseExitCode. $details"
    }

    $exhaustiveExitCode = Invoke-PictProcess `
        -Executable $PictPath `
        -Arguments "`"$modelPath`" /o:max" `
        -StandardOutputPath $exhaustiveTemp `
        -StandardErrorPath $exhaustiveErrorTemp
    if ($exhaustiveExitCode -ne 0) {
        $details = Get-Content -LiteralPath $exhaustiveErrorTemp -Raw -ErrorAction SilentlyContinue
        throw "PICT exhaustive generation failed with exit code $exhaustiveExitCode. $details"
    }

    $pairwiseRows = @(Import-Csv -LiteralPath $pairwiseTemp -Delimiter "`t")
    $exhaustiveRows = @(Import-Csv -LiteralPath $exhaustiveTemp -Delimiter "`t")
    if ($pairwiseRows.Count -eq 0) {
        throw "PICT produced no pairwise rows."
    }
    if ($exhaustiveRows.Count -eq 0) {
        throw "PICT produced no exhaustive rows."
    }

    $generatedRows = for ($index = 0; $index -lt $pairwiseRows.Count; $index++) {
        $record = [ordered]@{
            CaseId = "PW-{0:D3}" -f ($index + 1)
        }
        foreach ($property in $pairwiseRows[$index].PSObject.Properties) {
            $record[$property.Name] = $property.Value
        }
        [PSCustomObject]$record
    }

    Move-Item -LiteralPath $pairwiseTemp -Destination $pairwisePath -Force
    Move-Item -LiteralPath $exhaustiveTemp -Destination $exhaustivePath -Force
    $generatedRows | Export-Csv -LiteralPath $generatedCasesPath -NoTypeInformation -Encoding UTF8

    $toolHash = (Get-FileHash -LiteralPath $PictPath -Algorithm SHA256).Hash
    $modelHash = (Get-FileHash -LiteralPath $modelPath -Algorithm SHA256).Hash
    $commit = (& git -C $repositoryRoot rev-parse HEAD 2>$null)
    if ($LASTEXITCODE -ne 0) {
        $commit = "UNKNOWN"
    }

    $pairwiseMessages = Get-Content -LiteralPath $pairwiseErrorTemp -Raw -ErrorAction SilentlyContinue
    $exhaustiveMessages = Get-Content -LiteralPath $exhaustiveErrorTemp -Raw -ErrorAction SilentlyContinue
    @(
        "GeneratedAt=$(Get-Date -Format o)"
        "Commit=$commit"
        "PictPath=$PictPath"
        "PictSHA256=$toolHash"
        "ModelSHA256=$modelHash"
        "PairwiseCommand=pict.exe model.pict /o:2 /r:$Seed"
        "ExhaustiveCommand=pict.exe model.pict /o:max"
        "Seed=$Seed"
        "PairwiseCases=$($pairwiseRows.Count)"
        "FeasibleExhaustiveCases=$($exhaustiveRows.Count)"
        ""
        "[Pairwise stderr]"
        $pairwiseMessages
        ""
        "[Exhaustive stderr]"
        $exhaustiveMessages
    ) | Set-Content -LiteralPath $logPath -Encoding UTF8

    Write-Host "Generation completed successfully."
    Write-Host "Pairwise cases: $($pairwiseRows.Count)"
    Write-Host "Feasible exhaustive cases: $($exhaustiveRows.Count)"
    Write-Host "Generated cases: $generatedCasesPath"
}
finally {
    foreach ($temporaryFile in @($pairwiseTemp, $pairwiseErrorTemp, $exhaustiveTemp, $exhaustiveErrorTemp)) {
        if (Test-Path -LiteralPath $temporaryFile) {
            Remove-Item -LiteralPath $temporaryFile -Force
        }
    }
}
