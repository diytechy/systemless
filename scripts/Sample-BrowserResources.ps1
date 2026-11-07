[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$Output,
    [ValidateRange(5,300)][int]$Seconds = 30
)
$ErrorActionPreference = 'Stop'
$rows = [System.Collections.Generic.List[object]]::new()
$logical = [Environment]::ProcessorCount
$timer = [Diagnostics.Stopwatch]::StartNew()
while ($timer.Elapsed.TotalSeconds -lt $Seconds) {
    $at = [DateTimeOffset]::UtcNow.ToString('o')
    $hostLoad = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
    $processRows = @(Get-Process | Where-Object { $_.ProcessName -match '^(chrome|msedge|Codex|ChatGPT|OpenAI)' } | ForEach-Object {
        [pscustomobject]@{ pid=$_.Id; name=$_.ProcessName; cpuSeconds=$_.CPU; workingSetBytes=$_.WorkingSet64; privateBytes=$_.PrivateMemorySize64 }
    })
    $rows.Add([pscustomobject]@{ at=$at; elapsedSeconds=$timer.Elapsed.TotalSeconds; hostTotalCpuPercent=$hostLoad.PercentProcessorTime; processes=$processRows })
    Start-Sleep -Milliseconds 1000
}
$report = [pscustomobject]@{
    boundary='All matching browser/Codex processes on this host, including unrelated tabs and agents; not isolated game CPU or memory. CPU is cumulative process seconds; hostTotalCpuPercent is host-wide context.'
    logicalProcessors=$logical
    samples=$rows
}
$parent = Split-Path -Parent ([IO.Path]::GetFullPath($Output))
[IO.Directory]::CreateDirectory($parent) | Out-Null
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Output -Encoding utf8
