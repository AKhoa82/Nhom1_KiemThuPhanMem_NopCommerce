[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost/',
    [ValidateRange(1, 600)]
    [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')).Path
$composePath = Join-Path $repositoryRoot 'docker-compose.yml'

if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI was not found. Install/start Docker Desktop, then follow setup.md.'
}

& docker.exe info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker engine is not ready. Start Docker Desktop in Linux containers mode, wait until it is running, then retry.'
}

Write-Host 'Starting the existing nopCommerce containers...'
& docker.exe compose -f $composePath start
if ($LASTEXITCODE -ne 0) {
    throw 'docker compose start failed. Check Docker Desktop and docker compose ps -a. On a new machine, follow setup.md first.'
}

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
    try {
        $response = Invoke-WebRequest -Uri $BaseUrl -TimeoutSec 5 -UseBasicParsing
        $finalPath = $response.BaseResponse.RequestMessage.RequestUri.AbsolutePath
        if ($finalPath -match '^/install(?:/|$)') {
            throw 'nopCommerce redirected to /install. If this store was installed before, the web container may have lost App_Data/appsettings.json after recreation. Do not run the wizard against the existing database; restore the web connection settings first.'
        }
        if ($response.StatusCode -eq 200) {
            Write-Host "Storefront ready: $BaseUrl (HTTP 200)"
            exit 0
        }
    }
    catch {
        if ($_.Exception.Message -match 'redirected to /install') { throw }
    }
    Start-Sleep -Seconds 3
} while ((Get-Date) -lt $deadline)

throw "Storefront did not become ready at $BaseUrl within $TimeoutSeconds seconds. Check docker compose ps -a and Docker logs."
