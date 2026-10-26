<#
  Scope Creep - machine setup. Installs everything an agent machine needs and
  writes the machine's local config (.agent\local.json).

  Run from the repo root:
      powershell -NoProfile -ExecutionPolicy Bypass -File setup\setup.ps1

  Safe to re-run: every step checks first and only changes what is missing.
  Installs (per user, no admin needed): Node.js 24 LTS, GitHub CLI, Claude Code,
  llama.cpp (optional download), npm dependencies and Playwright Chromium.
#>
param(
    [string]$MachineId = '',
    [switch]$SkipDoctor
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo = Split-Path -Parent $PSScriptRoot
$AgentDir = Join-Path $Repo '.agent'
$LocalConfigPath = Join-Path $AgentDir 'local.json'
$ToolsDir = Join-Path $env:LOCALAPPDATA 'scope-creep\tools'
$Arch = 'x64'
if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') { $Arch = 'arm64' }
New-Item -ItemType Directory -Force $AgentDir, $ToolsDir | Out-Null

# ---------------------------------------------------------------- helpers

function Write-Step([string]$Text) { Write-Host ''; Write-Host "== $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host "   ok  $Text" -ForegroundColor Green }
function Write-Note([string]$Text) { Write-Host "   ..  $Text" -ForegroundColor Gray }
function Write-Problem([string]$Text) { Write-Host "   !!  $Text" -ForegroundColor Yellow }

function Test-Command([string]$Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

function Read-Default([string]$Prompt, [string]$Default) {
    $suffix = ''
    if ($Default -ne '') { $suffix = " [$Default]" }
    $answer = Read-Host "   $Prompt$suffix"
    if ([string]::IsNullOrWhiteSpace($answer)) { return $Default }
    return $answer.Trim().Trim('"')
}

function Read-YesNo([string]$Prompt, [bool]$Default) {
    $hint = 'y/N'
    if ($Default) { $hint = 'Y/n' }
    $answer = Read-Host "   $Prompt ($hint)"
    if ([string]::IsNullOrWhiteSpace($answer)) { return $Default }
    return $answer.Trim().ToLower().StartsWith('y')
}

function Select-Item([string]$Title, [object[]]$Items, [scriptblock]$Label, [int]$Default = 0) {
    Write-Host "   $Title"
    for ($i = 0; $i -lt $Items.Count; $i++) {
        $marker = ' '
        if ($i -eq $Default) { $marker = '*' }
        Write-Host ('   {0} {1,2}) {2}' -f $marker, ($i + 1), (& $Label $Items[$i]))
    }
    while ($true) {
        $answer = Read-Host "   Choose 1-$($Items.Count) [$($Default + 1)]"
        if ([string]::IsNullOrWhiteSpace($answer)) { return $Items[$Default] }
        $n = 0
        if ([int]::TryParse($answer, [ref]$n) -and $n -ge 1 -and $n -le $Items.Count) { return $Items[$n - 1] }
    }
}

function Add-UserPath([string]$Dir) {
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not $userPath) { $userPath = '' }
    if (($userPath -split ';') -notcontains $Dir) {
        [Environment]::SetEnvironmentVariable('Path', ($Dir + ';' + $userPath).TrimEnd(';'), 'User')
    }
    if (($env:Path -split ';') -notcontains $Dir) { $env:Path = "$Dir;$env:Path" }
}

function Get-Zip([string]$Url, [string]$Destination) {
    if (-not ($Url -match '^https://')) { throw "No download URL found (got '$Url'). GitHub's release list may have changed or be rate-limited; try again in a few minutes." }
    $zip = Join-Path $env:TEMP ([IO.Path]::GetFileName($Url))
    Write-Note "downloading $Url"
    Invoke-WebRequest -Uri $Url -OutFile $zip -UseBasicParsing
    New-Item -ItemType Directory -Force $Destination | Out-Null
    Expand-Archive -Path $zip -DestinationPath $Destination -Force
    Remove-Item $zip -Force
}

function Get-GitHubReleases([string]$RepoName, [int]$Count = 10) {
    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoName/releases?per_page=$Count" -Headers @{ 'User-Agent' = 'scope-creep-setup' }
    # Windows PowerShell 5.1 passes a JSON array down the pipeline as ONE object; emit the releases one by one.
    foreach ($release in $releases) { $release }
}

function Write-JsonNoBom([string]$Path, $Object) {
    $json = $Object | ConvertTo-Json -Depth 10
    [IO.File]::WriteAllText($Path, $json, (New-Object Text.UTF8Encoding $false))
}

# Runs a native command silently and returns its exit code. (In Windows PowerShell 5.1, redirecting
# a native command's stderr while ErrorActionPreference=Stop would abort the whole script.)
function Invoke-Quiet([scriptblock]$Command) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $Command *> $null } finally { $ErrorActionPreference = $previous }
    return $LASTEXITCODE
}

function Invoke-Checked([string]$What, [scriptblock]$Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$What failed (exit $LASTEXITCODE)" }
}

$existing = $null
if (Test-Path $LocalConfigPath) {
    $existing = Get-Content $LocalConfigPath -Raw | ConvertFrom-Json
}
$fleet = Get-Content (Join-Path $Repo 'agents\machines.json') -Raw | ConvertFrom-Json

Write-Host ''
Write-Host 'Scope Creep machine setup' -ForegroundColor White
Write-Host "repo: $Repo   arch: $Arch"

# ---------------------------------------------------------------- 1. git

Write-Step 'Git'
if (-not (Test-Command 'git')) {
    throw 'git is not installed. Install Git for Windows (https://git-scm.com/download/win), then re-run setup.'
}
Write-Ok (& git --version)
$gitBash = Join-Path (Split-Path -Parent (Split-Path -Parent (Get-Command git).Source)) 'bin\bash.exe'
if (Test-Path $gitBash) { Write-Ok "Git Bash: $gitBash" } else { Write-Problem 'Git Bash not found; Claude Code will fall back to PowerShell for shell commands.' }

# ---------------------------------------------------------------- 2. node

Write-Step 'Node.js 24 LTS'
$nodeOk = $false
if (Test-Command 'node') {
    $major = [int]((& node --version).TrimStart('v').Split('.')[0])
    $nodeOk = $major -ge 24
}
if ($nodeOk) {
    Write-Ok "node $(& node --version)"
} else {
    $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing
    $release = $index | Where-Object { $_.lts -and ([int]$_.version.TrimStart('v').Split('.')[0]) -ge 24 -and ($_.files -contains "win-$Arch-zip") } | Select-Object -First 1
    if (-not $release) { throw "No Node.js 24+ LTS build found for win-$Arch" }
    $name = "node-$($release.version)-win-$Arch"
    $dest = Join-Path $ToolsDir 'node'
    Get-Zip "https://nodejs.org/dist/$($release.version)/$name.zip" $dest
    Add-UserPath (Join-Path $dest $name)
    Write-Ok "installed node $($release.version) to $dest"
}

# ---------------------------------------------------------------- 3. github cli + auth

Write-Step 'GitHub CLI + login'
if (-not (Test-Command 'gh')) {
    $rel = Get-GitHubReleases 'cli/cli' 5 | Where-Object { -not $_.prerelease } | Select-Object -First 1
    $ghArch = 'amd64'
    if ($Arch -eq 'arm64') { $ghArch = 'arm64' }
    $asset = $rel.assets | Where-Object { $_.name -like "gh_*_windows_$ghArch.zip" } | Select-Object -First 1
    $dest = Join-Path $ToolsDir 'gh'
    Get-Zip $asset.browser_download_url $dest
    Add-UserPath (Join-Path $dest 'bin')
    Write-Ok "installed $($rel.tag_name)"
} else {
    Write-Ok ((& gh --version) | Select-Object -First 1)
}
if ((Invoke-Quiet { & gh auth status --hostname github.com }) -ne 0) {
    Write-Note 'Log in to GitHub (a browser window will open). Use an account that can push to the repo.'
    Invoke-Checked 'gh auth login' { & gh auth login --hostname github.com --git-protocol https --web }
}
Invoke-Checked 'gh auth setup-git' { & gh auth setup-git }
Write-Ok 'GitHub auth ready (git uses gh credentials)'

# ---------------------------------------------------------------- 4. claude code

Write-Step 'Claude Code'
$claudeExe = Join-Path $env:USERPROFILE '.local\bin\claude.exe'
if (-not (Test-Command 'claude') -and -not (Test-Path $claudeExe)) {
    Write-Note 'installing Claude Code (native installer)'
    Invoke-RestMethod -Uri 'https://claude.ai/install.ps1' -UseBasicParsing | Invoke-Expression
}
Add-UserPath (Join-Path $env:USERPROFILE '.local\bin')
if (Test-Path $claudeExe) { $claudePath = $claudeExe } else { $claudePath = (Get-Command claude).Source }
Write-Ok "$claudePath ($(& $claudePath --version))"

# ---------------------------------------------------------------- 5. which machine is this?

Write-Step 'Machine identity'
$ids = @($fleet.machines.PSObject.Properties.Name)
if ($MachineId -eq '' -and $existing) { $MachineId = $existing.machineId }
$defaultIndex = [Math]::Max(0, [Array]::IndexOf($ids, $MachineId))
$MachineId = Select-Item 'Which machine is this?' $ids { param($id) "$id - $($fleet.machines.$id.label) ($($fleet.machines.$id.model))" } $defaultIndex
$machine = $fleet.machines.$MachineId
& git -C $Repo config user.name "agent-$MachineId"
& git -C $Repo config user.email "agent-$MachineId@scope-creep.local"
Write-Ok "this is '$MachineId' - roles: $($machine.roles -join ', ')"

# ---------------------------------------------------------------- 6. model server

Write-Step 'Model server'
$llama = @{}
$modeDefault = 0
if ($existing -and $existing.llama.mode -eq 'external') { $modeDefault = 1 }
$mode = Select-Item 'How is the model served?' @('managed', 'external') {
    param($m)
    if ($m -eq 'managed') { 'managed - the runner starts llama-server with a GGUF you pick (recommended)' }
    else { 'external - something else already serves an Anthropic-compatible API (e.g. Unsloth Studio)' }
} $modeDefault

if ($mode -eq 'managed') {
    # llama-server binary: reuse one already on this machine (Unsloth, LM Studio, PATH, earlier setup) or download
    $found = New-Object System.Collections.Generic.List[string]
    if ($existing -and $existing.llama.serverPath -and (Test-Path $existing.llama.serverPath)) { $found.Add($existing.llama.serverPath) }
    if (Test-Command 'llama-server') { $found.Add((Get-Command llama-server).Source) }
    foreach ($dir in @("$ToolsDir\llama.cpp", "$env:USERPROFILE\.unsloth", "$env:USERPROFILE\llama.cpp", "$env:USERPROFILE\.lmstudio\extensions\backends", 'C:\llama.cpp')) {
        if (Test-Path $dir) {
            Get-ChildItem -Path $dir -Recurse -Filter 'llama-server.exe' -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | ForEach-Object { $found.Add($_.FullName) }
        }
    }
    $choices = @($found | Select-Object -Unique) + @('download', 'manual')
    $choice = Select-Item 'Which llama-server should this machine use? (needs a 2026 build: Anthropic API + --fit)' $choices {
        param($c)
        if ($c -eq 'download') { 'Download the latest llama.cpp release for this machine' }
        elseif ($c -eq 'manual') { 'Enter a path manually' }
        else { '{0}  ({1:yyyy-MM-dd})' -f $c, (Get-Item $c).LastWriteTime }
    } 0
    $serverPath = $choice
    if ($choice -eq 'manual') { $serverPath = Read-Default 'Path to llama-server.exe' '' }
    if ($choice -eq 'download') {
        $hasNvidia = [bool](Get-CimInstance Win32_VideoController | Where-Object { $_.Name -match 'NVIDIA' })
        $releases = Get-GitHubReleases 'ggml-org/llama.cpp' 10
        $rel = $releases | Where-Object { $_.assets | Where-Object { $_.name -like "llama-*-bin-win-*-$Arch.zip" } } | Select-Object -First 1
        $assets = @($rel.assets | Where-Object { $_.name -like "llama-*-bin-win-*-$Arch.zip" } | Sort-Object { if ($_.name -match 'cuda') { 0 } elseif ($_.name -match 'vulkan') { 1 } else { 2 } }, { $_.name } )
        if ($hasNvidia) { $assets = @($assets | Sort-Object { if ($_.name -match 'cuda-13') { 0 } elseif ($_.name -match 'cuda') { 1 } else { 2 } }) }
        $asset = Select-Item "llama.cpp $($rel.tag_name) builds for win-$Arch (NVIDIA GPU: $hasNvidia):" $assets { param($a) $a.name } 0
        $dest = Join-Path $ToolsDir "llama.cpp\$($rel.tag_name)"
        Get-Zip $asset.browser_download_url $dest
        if ($asset.name -match 'cuda-([\d.]+)-') {
            $cudart = $rel.assets | Where-Object { $_.name -eq "cudart-llama-bin-win-cuda-$($Matches[1])-$Arch.zip" } | Select-Object -First 1
            if ($cudart) { Get-Zip $cudart.browser_download_url $dest }
        }
        $serverPath = (Get-ChildItem $dest -Recurse -Filter 'llama-server.exe' | Select-Object -First 1).FullName
    }
    if (-not (Test-Path $serverPath)) { throw "llama-server.exe not found at '$serverPath'" }
    Write-Ok "llama-server: $serverPath"

    # model file
    $modelDirDefault = ''
    if ($existing -and $existing.llama.modelPath) { $modelDirDefault = $existing.llama.modelsDir }
    if (-not $modelDirDefault) {
        foreach ($candidate in @("$env:USERPROFILE\.cache\huggingface\hub", "$env:USERPROFILE\.lmstudio\models", 'C:\models', 'D:\models')) {
            if (Test-Path $candidate) { $modelDirDefault = $candidate; break }
        }
    }
    $models = @()
    while ($models.Count -eq 0) {
        $modelsDir = Read-Default 'Folder that contains your GGUF models (searched recursively)' $modelDirDefault
        $filter = Read-Default 'Filter model names by' 'qwen'
        Write-Note "searching $modelsDir ..."
        $models = @(Get-ChildItem -Path $modelsDir -Recurse -Filter '*.gguf' -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "*$filter*" -and $_.Name -notmatch '^(mmproj|mtp-|dflash-)' -and ($_.Name -notmatch '-\d{5}-of-\d{5}\.gguf$' -or $_.Name -match '-00001-of-\d{5}\.gguf$') } |
            Sort-Object FullName)
        if ($models.Count -eq 0) { Write-Problem "no .gguf files matching '$filter' under $modelsDir" }
    }
    $model = Select-Item 'Which model should this machine run?' $models {
        param($f)
        $size = $f.Length
        if ($f.Name -match '-00001-of-(\d{5})\.gguf$') {
            $size = (Get-ChildItem $f.DirectoryName -Filter ($f.Name -replace '-00001-of-', '-*-of-') | Measure-Object Length -Sum).Sum
        }
        '{0}  ({1:N1} GB)' -f $f.Name, ($size / 1GB)
    } 0
    # Context: "auto" lets llama-server start from the model's maximum and --fit it to free memory
    # (never below 32k); the runner reads the real value from the server before every agent session.
    $ctxDefault = 'auto'
    if ($existing -and $existing.llama.ctxSize) { $ctxDefault = [string]$existing.llama.ctxSize }
    $ctxAnswer = Read-Default 'Context size: "auto" = largest that fits in memory (recommended), or a number of tokens' $ctxDefault
    $ctx = 0
    if ($ctxAnswer -ne 'auto') { $ctx = [int]$ctxAnswer }
    $port = Read-Default 'Port for llama-server' '8080'
    # Model id the API serves, e.g. qwen3.8-27b-ud-q4_k_xl
    $modelId = ([IO.Path]::GetFileNameWithoutExtension($model.Name) -replace '-00001-of-\d{5}$', '').ToLower()
    $extraArgs = @('--cache-type-k', 'q8_0', '--cache-type-v', 'q8_0', '--temp', '0.6', '--top-p', '0.95', '--top-k', '20', '--min-p', '0')
    if ($existing -and $existing.llama.extraArgs) { $extraArgs = @($existing.llama.extraArgs) }
    $llama = [ordered]@{
        mode       = 'managed'
        baseUrl    = "http://127.0.0.1:$port"
        model      = $modelId
        authToken  = 'local'
        ctxSize    = $ctx
        serverPath = $serverPath
        modelPath  = $model.FullName
        modelsDir  = $modelsDir
        extraArgs  = $extraArgs
    }
    Write-Ok "model: $($model.Name) as '$modelId', context $ctxAnswer, port $port"
} else {
    $baseDefault = 'http://127.0.0.1:8888'
    $modelDefault = ''
    $tokenDefault = 'local'
    $ctxDefault = 'auto'
    if ($existing -and $existing.llama.mode -eq 'external') {
        $baseDefault = $existing.llama.baseUrl; $modelDefault = $existing.llama.model; $tokenDefault = $existing.llama.authToken
        if ($existing.llama.ctxSize) { $ctxDefault = [string]$existing.llama.ctxSize }
    }
    $baseUrl = Read-Default 'Base URL of the Anthropic-compatible server' $baseDefault
    $modelId = Read-Default 'Model id (must match GET /v1/models)' $modelDefault
    $token = Read-Default 'API token' $tokenDefault
    $ctxAnswer = Read-Default 'Context size: "auto" = ask the server, or a number of tokens' $ctxDefault
    $ctx = 0
    if ($ctxAnswer -ne 'auto') { $ctx = [int]$ctxAnswer }
    $llama = [ordered]@{
        mode      = 'external'
        baseUrl   = $baseUrl
        model     = $modelId
        authToken = $token
        ctxSize   = $ctx
    }
}

$local = [ordered]@{
    machineId  = $MachineId
    claudePath = $claudePath
    llama      = $llama
}
Write-JsonNoBom $LocalConfigPath $local
Write-Ok "wrote $LocalConfigPath"

# ---------------------------------------------------------------- 7. dependencies

Write-Step 'Dependencies'
Push-Location $Repo
try {
    Invoke-Checked 'npm ci (loop)' { & npm ci --no-audit --no-fund }
    & npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { Write-Problem 'Playwright Chromium install failed; the smoke test will try Microsoft Edge instead.' }
    Push-Location (Join-Path $Repo 'game')
    try { Invoke-Checked 'npm ci (game)' { & npm ci --no-audit --no-fund } } finally { Pop-Location }
    Set-Content -Path (Join-Path $AgentDir 'root-deps.sha') -Value (Get-FileHash (Join-Path $Repo 'package-lock.json')).Hash -Encoding ascii
} finally {
    Pop-Location
}
Write-Ok 'npm packages and browser installed'

# ---------------------------------------------------------------- 8. autostart

Write-Step 'Autostart'
if (Read-YesNo 'Start the agent loop automatically when you log in to Windows?' $false) {
    $script = Join-Path $Repo 'loop\start-agent.ps1'
    & schtasks /Create /F /TN 'ScopeCreepAgent' /SC ONLOGON /RL LIMITED /TR "powershell -NoProfile -ExecutionPolicy Bypass -File `"$script`"" | Out-Null
    Write-Ok "scheduled task 'ScopeCreepAgent' created (remove with: schtasks /Delete /TN ScopeCreepAgent /F)"
} else {
    Write-Note 'skipped (start manually with: npm run agent)'
}

# ---------------------------------------------------------------- 9. doctor

if (-not $SkipDoctor) {
    Write-Step 'Health check (starts the model server; first load can take a few minutes)'
    Push-Location $Repo
    try { & node loop/doctor.ts --gate } finally { Pop-Location }
}

Write-Host ''
Write-Host "Setup complete for '$MachineId'. Start the loop with:  npm run agent" -ForegroundColor Green
Write-Host 'Open a NEW terminal first so the updated PATH is picked up.' -ForegroundColor Gray
