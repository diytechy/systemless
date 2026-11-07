[CmdletBinding()]
param(
    [string]$BuildRoot = 'D:\SystemlessBuild',
    [string]$Source = 'D:\SheepShaver_MAC_Emulator\Content',
    [switch]$Extract,
    [switch]$Library,
    [string]$AdditionsManifest = '',
    [string]$DistDirectory = '',
    [string]$MediaDirectory = ''
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$trunk = Join-Path $BuildRoot 'tools\trunk-0.21.14\trunk.exe'
if (-not (Test-Path -LiteralPath $trunk)) { throw "Install Trunk 0.21.14 at $trunk (see docs/iterations/2026-11-06-koji-browser)." }
if ($AdditionsManifest -and -not $Library) { throw 'Additional entries require -Library.' }
if ($MediaDirectory -and -not $Library) { throw 'Staged MediaDirectory currently requires -Library.' }
if ($AdditionsManifest -and -not $DistDirectory) { throw 'Use an explicit staging DistDirectory for additional entries.' }
if (-not $DistDirectory) { $DistDirectory = Join-Path $repo 'www\dist' }
$DistDirectory = [IO.Path]::GetFullPath($DistDirectory)
$names = @('CARGO_TARGET_DIR','UV_CACHE_DIR','NO_COLOR','SYSTEMLESS_PRIVATE_KOJI','SYSTEMLESS_PRIVATE_LIBRARY','SYSTEMLESS_PRIVATE_ADDITIONS','SYSTEMLESS_PRIVATE_MEDIA')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
try {
    $env:CARGO_TARGET_DIR = Join-Path $BuildRoot 'target'
    $env:UV_CACHE_DIR = Join-Path $BuildRoot 'uv-cache'
    $env:NO_COLOR = 'false'
    $env:SYSTEMLESS_PRIVATE_KOJI = '1'
    if ($MediaDirectory) {
        if ($Extract) { throw 'Extract separately into a staged MediaDirectory before building.' }
        $MediaDirectory = (Resolve-Path -LiteralPath $MediaDirectory).Path
        $env:SYSTEMLESS_PRIVATE_MEDIA = $MediaDirectory
    } else { $MediaDirectory = Join-Path $repo 'www\private'; Remove-Item Env:SYSTEMLESS_PRIVATE_MEDIA -ErrorAction SilentlyContinue }
    if ($Library) { $env:SYSTEMLESS_PRIVATE_LIBRARY = '1' } else { Remove-Item Env:SYSTEMLESS_PRIVATE_LIBRARY -ErrorAction SilentlyContinue }
    if ($AdditionsManifest) {
        $AdditionsManifest = (Resolve-Path -LiteralPath $AdditionsManifest).Path
        & python "$PSScriptRoot\private_library_manifest.py" $AdditionsManifest
        if ($LASTEXITCODE -ne 0) { throw 'Additional private entry validation failed' }
        $env:SYSTEMLESS_PRIVATE_ADDITIONS = $AdditionsManifest
    } else { Remove-Item Env:SYSTEMLESS_PRIVATE_ADDITIONS -ErrorAction SilentlyContinue }
    $extractor = if ($Library) { 'extract_library.py' } else { 'extract_koji.py' }
    $requiredImages = if ($Library) { @('koji','clockwerx','delirium') } else { @('koji') }
    $missingImages = @($requiredImages | Where-Object { -not (Test-Path -LiteralPath "$MediaDirectory\$_.img") })
    if ($missingImages.Count -gt 0 -and $env:SYSTEMLESS_PRIVATE_MEDIA) { throw 'Staged MediaDirectory is missing required images.' }
    if ($Extract -or $missingImages.Count -gt 0) {
        & uv run --no-project --with machfs==1.3 --python 3.12 python "$PSScriptRoot\$extractor" --source $Source
        if ($LASTEXITCODE -ne 0) { throw 'Private game extraction failed' }
    }
    Push-Location "$repo\www"
    try {
        & $trunk build --release --locked --public-url / --dist $DistDirectory
        if ($LASTEXITCODE -ne 0) { throw 'Systemless browser build failed' }
    } finally { Pop-Location }
    if ($Library) {
        $packageArgs = @("$PSScriptRoot\package_library.py",$DistDirectory)
        $packageArgs += @('--media-directory',$MediaDirectory)
        if ($AdditionsManifest) { $packageArgs += @('--additions',$AdditionsManifest) }
        & python @packageArgs
    } else { & python "$PSScriptRoot\package_koji.py" $DistDirectory }
    if ($LASTEXITCODE -ne 0) { throw 'Private bundle packaging failed' }
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$saved[$name],'Process') }
}
