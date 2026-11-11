param(
    [Parameter(Mandatory=$true)][string]$AuthorizationPath,
    [Parameter(Mandatory=$true)][string]$AuthorizationSHA256,
    [switch]$ValidateOnly
)
$ErrorActionPreference = 'Stop'
$taskOutput = $null
$taskProcess = $null
$taskStart = $null
$taskOldExecutable = $env:SYSTEMLESS_LOAD_EXECUTABLE
$taskOldBacktrace = $env:RUST_BACKTRACE

function Assert-TaskPin($taskPin) {
    if ($null -eq $taskPin -or -not (Test-Path -LiteralPath $taskPin.path -PathType Leaf)) { throw 'Pinned file missing' }
    $taskInfo = Get-Item -LiteralPath $taskPin.path
    $taskDigest = (Get-FileHash -LiteralPath $taskPin.path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($taskDigest -cne $taskPin.sha256 -or $taskInfo.Length -ne $taskPin.bytes) { throw "Pinned file changed: $($taskPin.path)" }
}
function Write-TaskJsonExclusive([string]$taskPath, $taskValue) {
    $taskText = ($taskValue | ConvertTo-Json -Depth 30) + "`n"
    $taskStream = [IO.File]::Open($taskPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
    try {
        $taskBytes = [Text.UTF8Encoding]::new($false).GetBytes($taskText)
        $taskStream.Write($taskBytes, 0, $taskBytes.Length)
        $taskStream.Flush($true)
    } finally { $taskStream.Dispose() }
}
function Get-TaskFilePin([string]$taskPath) {
    $taskInfo = Get-Item -LiteralPath $taskPath
    return [ordered]@{path=$taskInfo.FullName;bytes=$taskInfo.Length;sha256=(Get-FileHash -LiteralPath $taskPath -Algorithm SHA256).Hash.ToLowerInvariant()}
}

try {
    if ($AuthorizationSHA256 -cnotmatch '^[0-9a-f]{64}$' -or (Get-FileHash -LiteralPath $AuthorizationPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $AuthorizationSHA256) { throw 'Authorization hash mismatch' }
    $taskAuth = Get-Content -LiteralPath $AuthorizationPath -Raw | ConvertFrom-Json
    if ($taskAuth.schema -cne 'clockwerx-original-native-authorization-v1' -or $taskAuth.authority -cne 'Root' -or $taskAuth.executionApproved -isnot [bool] -or -not $taskAuth.executionApproved -or -not $taskAuth.invocationID) { throw 'Fresh explicit Root native authorization required' }
    if ($taskAuth.purpose -cne 'clockwerx-bounded-original-capture-v1' -or $taskAuth.mode -cnotin @('cold','rehearsal') -or $taskAuth.wallBoundSeconds -lt 1 -or $taskAuth.wallBoundSeconds -gt 600 -or $taskAuth.maxFrontendTicks -lt 1 -or $taskAuth.maxFrontendTicks -gt 6800 -or $taskAuth.plannedFrontendTicks -gt $taskAuth.maxFrontendTicks -or $taskAuth.captureCount -lt 1 -or $taskAuth.captureCount -gt 64 -or $taskAuth.captureViewingAuthorized -ne $false) { throw 'Native capture/view bounds mismatch' }
    foreach ($taskGate in @('earnedFixtureReviewed','entryAndCapturePlanReviewed','noDedicatedPNGViewed','sourceFitterGateRequiredBeforePNGView')) {
        if ($taskAuth.gates.$taskGate -isnot [bool] -or -not $taskAuth.gates.$taskGate) { throw "Root gate incomplete: $taskGate" }
    }
    foreach ($taskPin in @($taskAuth.supervisor,$taskAuth.scenario,$taskAuth.capturePlan,$taskAuth.fixture,$taskAuth.fixtureReview,$taskAuth.originalPreservedImage,$taskAuth.executable,$taskAuth.entryControlSource,$taskAuth.viewGateDraft)) { Assert-TaskPin $taskPin }
    if ($taskAuth.mode -ceq 'rehearsal') {
        Assert-TaskPin $taskAuth.actualCandidateReview
        Assert-TaskPin $taskAuth.inputSidecar
        if ($taskAuth.gates.closedActualCandidateReviewed -ne $true) { throw 'Closed actual candidate review required' }
        $taskCandidate = Get-Content -LiteralPath $taskAuth.actualCandidateReview.path -Raw | ConvertFrom-Json
        if ($taskCandidate.status -cne 'CLOSED_CANDIDATE_GOAL' -or $taskCandidate.mode -cne 'candidate') { throw 'Original rehearsal needs a closed actual goal' }
    }
    $taskFixtureReview = Get-Content -LiteralPath $taskAuth.fixtureReview.path -Raw | ConvertFrom-Json
    if ($taskFixtureReview.destinationSha256 -cne $taskAuth.fixture.sha256) { throw 'Earned fixture review does not describe the pinned image' }
    if ([IO.Path]::GetFullPath($taskAuth.supervisor.path) -cne [IO.Path]::GetFullPath($PSCommandPath)) { throw 'Wrong pinned supervisor path' }
    $taskScenario = Get-Content -LiteralPath $taskAuth.scenario.path -Raw | ConvertFrom-Json
    $taskPlan = Get-Content -LiteralPath $taskAuth.capturePlan.path -Raw | ConvertFrom-Json
    $taskViewDraft = Get-Content -LiteralPath $taskAuth.viewGateDraft.path -Raw | ConvertFrom-Json
    if ($taskViewDraft.executionApproved -ne $false -or $taskScenario.version -ne 1 -or $taskScenario.clock -cne 'frontend_ticks' -or $taskScenario.application_partition_size -ne 4096000 -or $taskScenario.max_ticks -ne $taskAuth.maxFrontendTicks -or ($taskAuth.mode -ceq 'rehearsal' -and -not $taskScenario.export_save_files)) { throw 'Scenario or separate view gate mismatch' }
    $taskTicks = 0
    $taskCaptureNames = @()
    foreach ($taskAction in $taskScenario.actions) {
        if ($taskAction.type -ceq 'run') { $taskTicks += $taskAction.ticks }
        if ($taskAction.type -ceq 'screenshot') { $taskCaptureNames += $taskAction.name }
    }
    if ($taskTicks -ne $taskAuth.plannedFrontendTicks -or $taskCaptureNames.Count -ne $taskAuth.captureCount -or ($taskCaptureNames | Select-Object -Unique).Count -ne $taskAuth.captureCount -or (($taskCaptureNames | ConvertTo-Json -Compress) -cne (@($taskPlan.captures.name) | ConvertTo-Json -Compress))) { throw 'Predetermined capture plan mismatch' }
    if ($ValidateOnly) {
        Write-Output 'Native plan and all file pins validated; no process launched.'
        return
    }
    if (Get-CimInstance Win32_Process -Filter "Name='systemless.exe'") { throw 'Another original emulator is active' }
    $taskOutput = $taskAuth.outputPath
    if (Test-Path -LiteralPath $taskOutput) { throw 'Refuse native output overwrite' }
    foreach ($taskPath in @($taskAuth.fixture.path,$taskAuth.executable.path,$taskAuth.scenario.path,$taskOutput)) {
        if ($taskPath -match '[\s"]') { throw 'This exact private supervisor requires the reviewed paths without whitespace or quotes' }
    }
    Write-TaskJsonExclusive ($AuthorizationPath + '.CONSUMED') ([ordered]@{authSHA256=$AuthorizationSHA256;invocationID=$taskAuth.invocationID;UTC=[DateTime]::UtcNow.ToString('o')})
    New-Item -ItemType Directory -Path $taskOutput -ErrorAction Stop | Out-Null
    $taskCaptureOutput = Join-Path $taskOutput 'captures'
    $env:SYSTEMLESS_LOAD_EXECUTABLE = 'ClockWerx Folder/ClockWerx'
    $env:RUST_BACKTRACE = '1'
    $taskArguments = @($taskAuth.fixture.path,'--headless','--prefer-classic-68k','--screen-depth','8','--play-script',$taskAuth.scenario.path,'--play-output',$taskCaptureOutput)
    $taskStart = [Diagnostics.Stopwatch]::StartNew()
    $taskProcess = Start-Process -FilePath $taskAuth.executable.path -ArgumentList $taskArguments -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $taskOutput 'stderr.log') -RedirectStandardOutput (Join-Path $taskOutput 'stdout.log')
    $taskRetainedHandle = $taskProcess.Handle
    Write-TaskJsonExclusive (Join-Path $taskOutput 'owned-process.json') ([ordered]@{PID=$taskProcess.Id;startUTC=$taskProcess.StartTime.ToUniversalTime().ToString('o');executable=$taskAuth.executable.path;arguments=$taskArguments;fixtureSHA256=$taskAuth.fixture.sha256;authSHA256=$AuthorizationSHA256;invocationID=$taskAuth.invocationID;wallBoundSeconds=$taskAuth.wallBoundSeconds;handlePinnedBeforeWait=$true;captureViewingAuthorized=$false})
    $taskTimedOut = -not $taskProcess.WaitForExit([int]($taskAuth.wallBoundSeconds*1000))
    if ($taskTimedOut) { $taskProcess.Kill() }
    $taskProcess.WaitForExit()
    $taskExitCode = $taskProcess.ExitCode
    $taskActualPNGs = @()
    if (Test-Path -LiteralPath $taskCaptureOutput) {
        $taskActualPNGs = @(Get-ChildItem -LiteralPath $taskCaptureOutput -File -Filter '*.png' | Sort-Object Name | ForEach-Object { Get-TaskFilePin $_.FullName })
    }
    $taskActualNames = @($taskActualPNGs | ForEach-Object { [IO.Path]::GetFileNameWithoutExtension($_.path) })
    $taskExpectedSorted = @($taskCaptureNames | Sort-Object)
    $taskActualSorted = @($taskActualNames | Sort-Object)
    $taskAllPlannedCaptured = (($taskExpectedSorted | ConvertTo-Json -Compress) -ceq ($taskActualSorted | ConvertTo-Json -Compress))
    $taskReportPath = Join-Path $taskCaptureOutput 'report.json'
    $taskReport = $null
    $taskReportPin = $null
    if (Test-Path -LiteralPath $taskReportPath) { $taskReport = Get-Content -LiteralPath $taskReportPath -Raw | ConvertFrom-Json; $taskReportPin = Get-TaskFilePin $taskReportPath }
    $taskFixtureAfter = Get-TaskFilePin $taskAuth.fixture.path
    $taskPreservedAfter = Get-TaskFilePin $taskAuth.originalPreservedImage.path
    $taskInputsUnchanged = ($taskFixtureAfter.sha256 -ceq $taskAuth.fixture.sha256 -and $taskPreservedAfter.sha256 -ceq $taskAuth.originalPreservedImage.sha256)
    Write-TaskJsonExclusive (Join-Path $taskOutput 'capture-freeze.json') ([ordered]@{status='CLOSED_BYTES_FROZEN_NO_PIXEL_VIEW_AUTHORIZED';authSHA256=$AuthorizationSHA256;scenario=$taskAuth.scenario;capturePlan=$taskAuth.capturePlan;allActualPNGs=$taskActualPNGs;allPlannedCaptured=$taskAllPlannedCaptured;unexpectedOrFailurePNGsRetained=$true;report=$taskReportPin;nativePNGPixelReads=0;captureViewingAuthorized=$false;sourceFitterGateReviewRequired=$true;noAutomaticRetry=$true})
    $taskPassed = ($taskExitCode -eq 0 -and -not $taskTimedOut -and $taskInputsUnchanged -and $taskAllPlannedCaptured -and $null -ne $taskReport -and $taskReport.status -ceq 'passed' -and $taskReport.frontend_ticks -eq $taskAuth.plannedFrontendTicks -and $taskReport.budget_exhausted_frames -eq 0)
    Write-TaskJsonExclusive (Join-Path $taskOutput 'closure.json') ([ordered]@{status='CLOSED';PID=$taskProcess.Id;exitCode=$taskExitCode;timedOut=$taskTimedOut;elapsedSeconds=$taskStart.Elapsed.TotalSeconds;scriptActionsPassed=$taskPassed;sceneVisuallyVerified=$false;frontendTicks=if($taskReport){$taskReport.frontend_ticks}else{$null};guestTickObserved=if($taskReport){$taskReport.guest_tick}else{$null};allPlannedCaptured=$taskAllPlannedCaptured;actualCaptureCount=$taskActualPNGs.Count;fixtureAndPreservedImageUnchanged=$taskInputsUnchanged;captureViewingAuthorized=$false;sourceFitterGateReviewRequired=$true;noAutomaticRetry=$true;actualModelImports=0;actualModelUpdates=0})
    if (-not $taskPassed) { throw 'Closed capture failure retained; no retry or viewing authorized' }
} catch {
    if ($null -ne $taskProcess -and -not $taskProcess.HasExited) { $taskProcess.Kill(); $taskProcess.WaitForExit() }
    $taskFailure = [ordered]@{status='PREPARATION_OR_NATIVE_FAILURE_RETAINED_NO_RETRY';message=$_.Exception.Message;nativeChildLaunched=($null -ne $taskProcess);PID=if($taskProcess){$taskProcess.Id}else{$null};captureViewingAuthorized=$false;noAutomaticRetry=$true}
    $taskFailurePath = $AuthorizationPath + '.FAILURE-' + $PID + '.json'
    Write-TaskJsonExclusive $taskFailurePath $taskFailure
    throw
} finally {
    $env:SYSTEMLESS_LOAD_EXECUTABLE = $taskOldExecutable
    $env:RUST_BACKTRACE = $taskOldBacktrace
}
