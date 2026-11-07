[CmdletBinding()]
param([int]$Port = 8087, [switch]$NoBrowser, [switch]$Stop, [ValidateSet('','koji-the-frog','clockwerx','delirium')][string]$Game='')
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $repo 'www\dist'
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
