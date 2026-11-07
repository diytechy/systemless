[CmdletBinding()]
param(
    [string]$BuildRoot = 'D:\SystemlessBuild',
    [string]$Source = 'D:\SheepShaver_MAC_Emulator\Content',
    [switch]$Extract,
    [switch]$Library
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$trunk = Join-Path $BuildRoot 'tools\trunk-0.21.14\trunk.exe'
if (-not (Test-Path -LiteralPath $trunk)) { throw "Install Trunk 0.21.14 at $trunk (see docs/iterations/2026-11-06-koji-browser)." }
$names = @('CARGO_TARGET_DIR','UV_CACHE_DIR','NO_COLOR','SYSTEMLESS_PRIVATE_KOJI','SYSTEMLESS_PRIVATE_LIBRARY')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
try {
    $env:CARGO_TARGET_DIR = Join-Path $BuildRoot 'target'
    $env:UV_CACHE_DIR = Join-Path $BuildRoot 'uv-cache'
    $env:NO_COLOR = 'false'
    $env:SYSTEMLESS_PRIVATE_KOJI = '1'
    if ($Library) { $env:SYSTEMLESS_PRIVATE_LIBRARY = '1' } else { Remove-Item Env:SYSTEMLESS_PRIVATE_LIBRARY -ErrorAction SilentlyContinue }
    $extractor = if ($Library) { 'extract_library.py' } else { 'extract_koji.py' }
    $requiredImages = if ($Library) { @('koji','clockwerx','delirium') } else { @('koji') }
    $missingImages = @($requiredImages | Where-Object { -not (Test-Path -LiteralPath "$repo\www\private\$_.img") })
    if ($Extract -or $missingImages.Count -gt 0) {
        & uv run --no-project --with machfs==1.3 --python 3.12 python "$PSScriptRoot\$extractor" --source $Source
        if ($LASTEXITCODE -ne 0) { throw 'Private game extraction failed' }
    }
    Push-Location "$repo\www"
    try {
        & $trunk build --release --locked --public-url / --dist "$repo\www\dist"
        if ($LASTEXITCODE -ne 0) { throw 'Systemless browser build failed' }
    } finally { Pop-Location }
    if ($Library) { & python "$PSScriptRoot\package_library.py" "$repo\www\dist" } else { & python "$PSScriptRoot\package_koji.py" "$repo\www\dist" }
    if ($LASTEXITCODE -ne 0) { throw 'Private bundle packaging failed' }
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$saved[$name],'Process') }
}
