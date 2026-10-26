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
