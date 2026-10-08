[CmdletBinding()]
param(
    [string]$Version = "3.7.4",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$pairwiseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$toolDirectory = Join-Path $pairwiseRoot "tools"
$pictPath = Join-Path $toolDirectory "pict.exe"
$versionPath = Join-Path $toolDirectory "VERSION.txt"
$downloadUrl = "https://github.com/microsoft/pict/releases/download/v$Version/pict.exe"

$knownHashes = @{
    "3.7.4" = "80ABA862739CF18B4FAA13D408163324D188A1C4EFCCDD977D9C5BA3F8950BBD"
}

if (-not $knownHashes.ContainsKey($Version)) {
    throw "No trusted SHA-256 is recorded for PICT $Version. Add and review the official hash before installing it."
}

$expectedHash = $knownHashes[$Version].ToUpperInvariant()
New-Item -ItemType Directory -Force -Path $toolDirectory | Out-Null

if (Test-Path -LiteralPath $pictPath) {
    $currentHash = (Get-FileHash -LiteralPath $pictPath -Algorithm SHA256).Hash.ToUpperInvariant()
    if ($currentHash -eq $expectedHash -and -not $Force) {
        Write-Host "PICT $Version is already installed and its checksum is valid."
        Write-Host "Path: $pictPath"
        exit 0
    }

    if (-not $Force) {
        throw "pict.exe already exists but its checksum does not match PICT $Version. Re-run with -Force only after checking the file and URL."
    }
}

$temporaryPath = Join-Path $toolDirectory "pict.exe.download"
try {
    Write-Host "Downloading Microsoft PICT $Version..."
    Invoke-WebRequest -Uri $downloadUrl -OutFile $temporaryPath

    $actualHash = (Get-FileHash -LiteralPath $temporaryPath -Algorithm SHA256).Hash.ToUpperInvariant()
    if ($actualHash -ne $expectedHash) {
        throw "Checksum mismatch. Expected $expectedHash but received $actualHash."
    }

    Move-Item -LiteralPath $temporaryPath -Destination $pictPath -Force
    @(
        "Version=$Version"
        "Source=$downloadUrl"
        "SHA256=$actualHash"
    ) | Set-Content -LiteralPath $versionPath -Encoding UTF8

    Write-Host "PICT installed successfully."
    Write-Host "Path: $pictPath"
    Write-Host "SHA256: $actualHash"
}
finally {
    if (Test-Path -LiteralPath $temporaryPath) {
        Remove-Item -LiteralPath $temporaryPath -Force
    }
}
