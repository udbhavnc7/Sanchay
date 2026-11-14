<#
.SYNOPSIS
  Sanchay device-verify - automated subset of docs/device-verification-runbook.md section1.
.DESCRIPTION
  Installs an APK, asserts no high-risk permissions, launches the app, and captures a
  screenshot + logcat into device-evidence/. Manual checklist steps stay in the runbook.
  Requires: adb in PATH, exactly one connected device (or -Serial).
.EXAMPLE
  .\scripts\device-verify.ps1 -Apk app\build\outputs\apk\demo\app-demo.apk -Package app.sanchay.debug
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Apk,
  [string]$Package = 'app.sanchay.debug',
  [string]$Serial = '',
  [string]$EvidenceDir = 'device-evidence'
)

$ErrorActionPreference = 'Stop'
$failures = @()

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Bad($msg)  { Write-Host "  FAIL $msg" -ForegroundColor Red; $script:failures += $msg }

function Invoke-Adb {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    if ($Serial -ne '') { & adb -s $Serial @args 2>&1 }
    else { & adb @args 2>&1 }
  } finally {
    $ErrorActionPreference = $previous
  }
}

# --- preflight ---------------------------------------------------------------
Step 'Preflight'
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) { Bad 'adb not found in PATH'; exit 1 }
if (-not (Test-Path -LiteralPath $Apk)) { Bad "APK not found: $Apk"; exit 1 }

$connected = @(& adb devices | Where-Object { $_ -match "`tdevice$" })
if ($connected.Count -lt 1) { Bad 'No device connected (adb devices)'; exit 1 }
if ($connected.Count -gt 1 -and $Serial -eq '') { Bad 'Multiple devices connected - pass -Serial'; exit 1 }
Ok "device(s) connected: $($connected.Count)"

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# --- install ----------------------------------------------------------------
Step "Installing $Apk"
Invoke-Adb install -r $Apk
if ($LASTEXITCODE -ne 0) { Bad 'adb install failed'; exit 1 }
Ok 'installed'

# --- permission assertion ---------------------------------------------------
Step "Asserting permissions for $Package"
$pkgDump = (Invoke-Adb shell dumpsys package $Package) -join "`n"
Set-Content -Path (Join-Path $EvidenceDir "package-info-$stamp.txt") -Value $pkgDump

$denyPerms = @(
  'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
  'READ_SMS', 'RECEIVE_SMS', 'SEND_SMS', 'RECEIVE_MMS',
  'READ_CALL_LOG', 'WRITE_CALL_LOG', 'PROCESS_OUTGOING_CALLS',
  'READ_CONTACTS', 'WRITE_CONTACTS',
  'QUERY_ALL_PACKAGES'
)
foreach ($p in $denyPerms) {
  if ($pkgDump -match [regex]::Escape("android.permission.$p")) {
    Bad "high-risk permission present: $p"
  } else {
    Ok "absent: $p"
  }
}
foreach ($p in @('INTERNET', 'ACCESS_NETWORK_STATE', 'POST_NOTIFICATIONS')) {
  if ($pkgDump -match [regex]::Escape("android.permission.$p")) { Ok "present: $p" }
  else { Bad "expected permission missing: $p" }
}

# --- launch + capture -------------------------------------------------------
Step 'Launching RootActivity'
$resolved = @(Invoke-Adb shell cmd package resolve-activity --brief $Package | Where-Object { $_ -match '/' })
if ($resolved.Count -eq 0) { Bad "could not resolve launcher activity for $Package"; exit 1 }
$component = $resolved[-1].Trim()
Ok "launcher: $component"
Invoke-Adb shell am start -n $component | Out-Null
Start-Sleep -Seconds 5

Step 'Capturing screenshot'
$shot = Join-Path $EvidenceDir "screenshot-$stamp.png"
Invoke-Adb shell screencap -p /sdcard/sanchay-verify.png | Out-Null
Invoke-Adb pull /sdcard/sanchay-verify.png $shot | Out-Null
Invoke-Adb shell rm /sdcard/sanchay-verify.png | Out-Null
if (Test-Path $shot) { Ok "screenshot: $shot" } else { Bad 'screenshot capture failed' }

Step 'Dumping logcat'
$appPid = @(Invoke-Adb shell pidof $Package | Where-Object { $_ -match '^\d+$' }) | Select-Object -First 1
$logFile = Join-Path $EvidenceDir "logcat-$stamp.txt"
if ($appPid) {
  Invoke-Adb logcat -d --pid $appPid -v time | Set-Content -Path $logFile -Encoding utf8
  Ok "logcat ($Package pid $appPid): $logFile"
} else {
  Invoke-Adb logcat -d -v time | Set-Content -Path $logFile -Encoding utf8
  Ok "logcat (all processes - app not running): $logFile"
}

foreach ($pattern in @('upi://', 'READ_SMS', 'LocationManager')) {
  $hits = @(Select-String -Path $logFile -Pattern ([regex]::Escape($pattern)) -SimpleMatch -ErrorAction SilentlyContinue)
  if ($hits.Count -gt 0) { Bad "logcat contains '$pattern' ($($hits.Count) lines)" }
  else { Ok "logcat clean of '$pattern'" }
}

# --- summary ----------------------------------------------------------------
Write-Host ''
if ($failures.Count -eq 0) {
  Write-Host "device-verify: PASS - evidence in $EvidenceDir. Now run the manual steps in docs/device-verification-runbook.md section2." -ForegroundColor Green
  exit 0
}
Write-Host "device-verify: FAIL ($($failures.Count))" -ForegroundColor Red
$failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
exit 1
