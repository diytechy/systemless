[CmdletBinding()]
param(
    [string]$BuildRoot = 'D:\SystemlessBuild',
    [string]$Source = 'D:\SheepShaver_MAC_Emulator\Content',
    [switch]$Extract
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$trunk = Join-Path $BuildRoot 'tools\trunk-0.21.14\trunk.exe'
if (-not (Test-Path -LiteralPath $trunk)) { throw "Install Trunk 0.21.14 at $trunk (see docs/iterations/2026-11-06-koji-browser)." }
$names = @('CARGO_TARGET_DIR','UV_CACHE_DIR','NO_COLOR','SYSTEMLESS_PRIVATE_KOJI')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
try {
    $env:CARGO_TARGET_DIR = Join-Path $BuildRoot 'target'
    $env:UV_CACHE_DIR = Join-Path $BuildRoot 'uv-cache'
    $env:NO_COLOR = 'false'
    $env:SYSTEMLESS_PRIVATE_KOJI = '1'
    if ($Extract -or -not (Test-Path -LiteralPath "$repo\www\private\koji.img")) {
        & uv run --no-project --with machfs==1.3 --python 3.12 python "$PSScriptRoot\extract_koji.py" --source $Source
        if ($LASTEXITCODE -ne 0) { throw 'Koji extraction failed' }
    }
    Push-Location "$repo\www"
    try {
        & $trunk build --release --locked --public-url / --dist "$repo\www\dist"
        if ($LASTEXITCODE -ne 0) { throw 'Systemless browser build failed' }
    } finally { Pop-Location }
    & python "$PSScriptRoot\package_koji.py" "$repo\www\dist"
    if ($LASTEXITCODE -ne 0) { throw 'Private bundle packaging failed' }
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$saved[$name],'Process') }
}
