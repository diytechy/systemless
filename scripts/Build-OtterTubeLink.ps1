[CmdletBinding()]
param(
    # Everything this build writes goes under here: Cargo target, Trunk dist, the one-row manifest.
    [string]$BuildRoot = 'D:\SystemlessBuild\ottertube-link',
    # Read only: koji.img, clockwerx.img and delirium.img as the private library build uses them.
    [string]$MediaDirectory = 'D:\SystemlessBuild\private-library-20261107\media-preserved-v1',
    # Read only: the reviewed manifest that holds the Blobbo row.
    [string]$ReviewedAdditions = '',
    [string]$Trunk = 'D:\SystemlessBuild\tools\trunk-0.21.14\trunk.exe',
    # OtterTube's origins, in full (https://host[:port]). The page listens only to these.
    [Parameter(Mandatory)][string[]]$OtterTubeHost,
    [int]$Jobs = 8,
    [switch]$PackageOnly
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
if (-not $ReviewedAdditions) { $ReviewedAdditions = Join-Path $repo 'docs\iterations\2026-11-07-library-coordinator\reviewed-additions.json' }
if (-not (Test-Path -LiteralPath $Trunk)) { throw "Trunk was not found at $Trunk." }
$BuildRoot = [IO.Path]::GetFullPath($BuildRoot)
$MediaDirectory = (Resolve-Path -LiteralPath $MediaDirectory).Path
$ReviewedAdditions = (Resolve-Path -LiteralPath $ReviewedAdditions).Path
New-Item -ItemType Directory -Force -Path $BuildRoot | Out-Null
$dist = Join-Path $BuildRoot 'dist'
$manifest = Join-Path $BuildRoot 'additions-blobbo.json'

# The slim build takes one row from the reviewed manifest. The file holds paths, never game bytes.
$reviewed = Get-Content -LiteralPath $ReviewedAdditions -Raw -Encoding utf8 | ConvertFrom-Json
$blobbo = @($reviewed.entries | Where-Object { $_.slug -eq 'blobbo' })
if ($blobbo.Count -ne 1) { throw 'The reviewed manifest must hold exactly one blobbo row.' }
$json = [ordered]@{ schema_version = 1; entries = $blobbo } | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($manifest, $json + "`n", [Text.UTF8Encoding]::new($false))

$names = @('CARGO_TARGET_DIR','CARGO_BUILD_JOBS','NO_COLOR','SYSTEMLESS_PRIVATE_KOJI','SYSTEMLESS_PRIVATE_LIBRARY','SYSTEMLESS_PRIVATE_ADDITIONS','SYSTEMLESS_PRIVATE_MEDIA','SYSTEMLESS_CATALOGUE_PRODUCTION')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
try {
    $env:CARGO_TARGET_DIR = Join-Path $BuildRoot 'target'
    $env:CARGO_BUILD_JOBS = "$Jobs"
    $env:NO_COLOR = 'false'
    $env:SYSTEMLESS_PRIVATE_KOJI = '1'
    $env:SYSTEMLESS_PRIVATE_LIBRARY = '1'
    $env:SYSTEMLESS_PRIVATE_MEDIA = $MediaDirectory
    $env:SYSTEMLESS_PRIVATE_ADDITIONS = $manifest
    Remove-Item Env:SYSTEMLESS_CATALOGUE_PRODUCTION -ErrorAction SilentlyContinue
    & python "$PSScriptRoot\private_library_manifest.py" $manifest
    if ($LASTEXITCODE -ne 0) { throw 'The Blobbo row did not validate (image missing or changed).' }
    if (-not $PackageOnly) {
        Push-Location "$repo\www"
        try {
            & $Trunk build --release --locked --features ottertube --public-url / --dist $dist
            if ($LASTEXITCODE -ne 0) { throw 'The slim browser build failed.' }
        } finally { Pop-Location }
    }
    $packageArgs = @("$PSScriptRoot\package_library.py", $dist, '--media-directory', $MediaDirectory, '--additions', $manifest)
    foreach ($origin in $OtterTubeHost) { $packageArgs += @('--ottertube-host', $origin) }
    & python @packageArgs
    if ($LASTEXITCODE -ne 0) { throw 'Packaging the slim bundle failed.' }
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$saved[$name],'Process') }
}
