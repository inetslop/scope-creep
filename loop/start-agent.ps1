<#
  Supervisor for the agent runner (npm run agent). Keeps loop/runner.ts alive:
    exit 0   clean stop (.agent\STOP file)          -> exit
    exit 75  loop code changed upstream             -> reinstall deps if needed, restart now
    exit 76  model server unavailable               -> wait 60s, restart
    other    crash                                  -> git pull (a fix may have landed), back off, restart
  It also relaunches itself when this file changes on disk (after a git pull).

  Stop gracefully:   New-Item .agent\STOP      (finishes the current task first)
  Stop now:          Ctrl+C
#>
$ErrorActionPreference = 'Continue'
$Repo = Split-Path -Parent $PSScriptRoot
Set-Location $Repo
$AgentDir = Join-Path $Repo '.agent'
New-Item -ItemType Directory -Force (Join-Path $AgentDir 'logs') | Out-Null
$SelfHash = (Get-FileHash $PSCommandPath).Hash
$DepsStamp = Join-Path $AgentDir 'root-deps.sha'

function Write-Log([string]$Message) {
    $line = '{0} [supervisor] {1}' -f (Get-Date -Format 'HH:mm:ss'), $Message
    Write-Host $line -ForegroundColor Cyan
    Add-Content -Path (Join-Path $AgentDir 'logs\supervisor.log') -Value $line
}

# Clicking inside a classic console window starts a QuickEdit selection, which pauses every
# program writing to that window until Enter/Esc is pressed: the runner, and the agent and model
# waiting on it, would silently freeze. Turn QuickEdit off for this window.
function Disable-QuickEdit {
    try {
        Add-Type -Namespace ScopeCreep -Name ConsoleMode -ErrorAction Stop -MemberDefinition @'
[DllImport("kernel32.dll", SetLastError = true)] public static extern IntPtr GetStdHandle(int nStdHandle);
[DllImport("kernel32.dll", SetLastError = true)] public static extern bool GetConsoleMode(IntPtr hConsoleHandle, out uint lpMode);
[DllImport("kernel32.dll", SetLastError = true)] public static extern bool SetConsoleMode(IntPtr hConsoleHandle, uint dwMode);
'@
        $stdin = [ScopeCreep.ConsoleMode]::GetStdHandle(-10)
        $mode = [uint32]0
        if (-not [ScopeCreep.ConsoleMode]::GetConsoleMode($stdin, [ref]$mode)) { return } # not a console (e.g. redirected)
        # Clear ENABLE_QUICK_EDIT_MODE (0x40); ENABLE_EXTENDED_FLAGS (0x80) must be set for that to stick.
        $newMode = [uint32](($mode -band 0xFFBF) -bor 0x80)
        if ([ScopeCreep.ConsoleMode]::SetConsoleMode($stdin, $newMode)) { Write-Log 'QuickEdit is off: clicking in this window will not pause the agent' }
    } catch {
        Write-Log "could not turn off QuickEdit ($($_.Exception.Message)); avoid clicking in this window"
    }
}

function Sync-RootDeps {
    $hash = (Get-FileHash (Join-Path $Repo 'package-lock.json')).Hash
    $old = ''
    if (Test-Path $DepsStamp) { $old = (Get-Content $DepsStamp -Raw).Trim() }
    if ($hash -eq $old -and (Test-Path (Join-Path $Repo 'node_modules'))) { return }
    Write-Log 'loop dependencies changed: npm ci'
    & npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { Write-Log 'npm ci failed'; return }
    & npx playwright install chromium
    Set-Content -Path $DepsStamp -Value $hash -Encoding ascii
}

Disable-QuickEdit
$backoff = 15
while ($true) {
    if ((Get-FileHash $PSCommandPath).Hash -ne $SelfHash) {
        Write-Log 'start-agent.ps1 changed; relaunching the new version'
        & powershell -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath
        exit $LASTEXITCODE
    }
    Sync-RootDeps
    Write-Log 'starting runner'
    & node loop/runner.ts
    $code = $LASTEXITCODE
    if ($code -eq 0) {
        Write-Log 'runner stopped cleanly'
        exit 0
    } elseif ($code -eq 75) {
        Write-Log 'runner restarting to load updated loop code'
        $backoff = 15
    } elseif ($code -eq 76) {
        Write-Log 'model server unavailable; retrying in 60s (see .agent\logs\llama-server.log)'
        Start-Sleep -Seconds 60
    } else {
        Write-Log "runner crashed (exit $code); pulling latest and restarting in $backoff s"
        & git pull --ff-only --quiet
        Start-Sleep -Seconds $backoff
        $backoff = [Math]::Min($backoff * 2, 600)
    }
}
