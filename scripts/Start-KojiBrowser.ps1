[CmdletBinding()]
param([int]$Port = 8087, [switch]$NoBrowser, [switch]$Stop)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $repo 'www\dist'
$server = Join-Path $PSScriptRoot 'serve_koji.py'
$url = "http://localhost:$Port/koji-the-frog/"
function Get-KojiServer {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/_koji/health" -TimeoutSec 2
    } catch {
        if ($_.Exception.Response) { throw 'The selected port belongs to another server.' }
        return $null
    }
    if ($health.app -eq 'systemless-private-koji' -and $health.directory -eq $dist) { return $health }
    throw 'The selected port belongs to another server.'
}
$health = Get-KojiServer
if ($Stop) {
    if ($null -eq $health) { Write-Host 'Koji server is already stopped.'; return }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($health.pid)"
    if (-not $process -or $process.CommandLine -notmatch [regex]::Escape($server)) {
        throw 'The server process does not match this launcher; it was left running.'
    }
    Stop-Process -Id $health.pid
    Write-Host 'Koji server stopped.'
    return
}
if (-not (Test-Path -LiteralPath "$dist\private\koji.img")) {
    throw 'Build the browser bundle first: scripts\Build-KojiBrowser.ps1'
}
if ($null -eq $health) {
    $python = (Get-Command python -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
    $logs = Join-Path $repo 'www\private'
    $arguments = @('-u', ('"{0}"' -f $server), '--port', "$Port", '--directory', ('"{0}"' -f $dist))
    $child = Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $repo -WindowStyle Hidden -PassThru -RedirectStandardOutput "$logs\server.out.log" -RedirectStandardError "$logs\server.err.log"
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ($child.HasExited) { throw "Koji server could not start. See $logs\server.err.log" }
        $health = Get-KojiServer
        if ($health) { break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $health) {
        if (-not $child.HasExited) { Stop-Process -Id $child.Id }
        throw "Koji server did not become ready. See $logs\server.err.log"
    }
}
if (-not $NoBrowser) { Start-Process $url }
Write-Host "Koji is ready: $url"
