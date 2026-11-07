[CmdletBinding()]
param([int]$Port = 8087, [switch]$NoBrowser, [switch]$Stop, [string]$Game='', [string]$DistDirectory='')
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$selectionPath = Join-Path $repo 'www\private\active-library.json'
if (-not $DistDirectory -and (Test-Path -LiteralPath $selectionPath)) {
    $selection = Get-Content -LiteralPath $selectionPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($selection.schema_version -ne 1 -or -not [IO.Path]::IsPathRooted($selection.directory)) { throw 'Invalid selected library directory.' }
    $DistDirectory = $selection.directory
}
$dist = if ($DistDirectory) { [IO.Path]::GetFullPath($DistDirectory) } else { Join-Path $repo 'www\dist' }
if ($Game -and $Game -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') { throw 'Invalid game route.' }
$routes = @('koji-the-frog','clockwerx','delirium')
$metadataPath = Join-Path $dist 'private-library.json'
if (Test-Path -LiteralPath $metadataPath) {
    $metadata = Get-Content -LiteralPath $metadataPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($metadata.schema_version -ne 1) { throw 'Unsupported packaged library metadata.' }
    $routes = @($metadata.entries | ForEach-Object { $_.route.Trim('/') })
    if ($metadata.experiments) { $routes += @($metadata.experiments | ForEach-Object { $_.route.Trim('/') }) }
}
if ($Game -and $Game -notin $routes) { throw 'Game route is not in this packaged library.' }
$server = Join-Path $PSScriptRoot 'serve_library.py'
$url = if ($Game) { "http://localhost:$Port/$Game/" } else { "http://localhost:$Port/" }
function Get-MacGamesServer {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/_macgames/health" -TimeoutSec 2
    } catch {
        if ($_.Exception.Response) { throw 'The selected port belongs to another server.' }
        return $null
    }
    if ($health.app -eq 'systemless-private-library' -and $health.directory -eq $dist) { return $health }
    throw 'The selected port belongs to another server.'
}
$health = Get-MacGamesServer
if ($Stop) {
    if ($null -eq $health) { Write-Host 'Macintosh Arcade server is already stopped.'; return }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($health.pid)"
    if (-not $process -or $process.CommandLine -notmatch [regex]::Escape($server)) {
        throw 'The server process does not match this launcher; it was left running.'
    }
    Stop-Process -Id $health.pid
    Write-Host 'Macintosh Arcade server stopped.'
    return
}
if (-not (Test-Path -LiteralPath "$dist\private\clockwerx.img") -or -not (Test-Path -LiteralPath "$dist\private\delirium.img") -or -not (Test-Path -LiteralPath "$dist\private\koji.img")) {
    throw 'Build the browser bundle first: scripts\Build-MacGames.ps1'
}
if ($null -eq $health) {
    $python = (Get-Command python -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
    $logs = Join-Path $repo 'www\private'
    $arguments = @('-u', ('"{0}"' -f $server), '--port', "$Port", '--directory', ('"{0}"' -f $dist))
    $child = Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $repo -WindowStyle Hidden -PassThru -RedirectStandardOutput "$logs\server.out.log" -RedirectStandardError "$logs\server.err.log"
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ($child.HasExited) { throw "Macintosh Arcade server could not start. See $logs\server.err.log" }
        $health = Get-MacGamesServer
        if ($health) { break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $health) {
        if (-not $child.HasExited) { Stop-Process -Id $child.Id }
        throw "Macintosh Arcade server did not become ready. See $logs\server.err.log"
    }
}
if (-not $NoBrowser) { Start-Process $url }
Write-Host "Macintosh Arcade is ready: $url"
