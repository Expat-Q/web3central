$ErrorActionPreference = "Stop"

$workspaceRoot = "c:\Users\HomePC\Downloads\web3central"
$geminiRoot = "C:\Users\HomePC\.gemini\antigravity"

$backupDir = Join-Path $workspaceRoot "backups\antigravity"
$dateStr = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupFile = Join-Path $backupDir "antigravity_backup_$dateStr.zip"

$archiveSessionsDir = Join-Path $geminiRoot "archived_sessions"
$archiveBrainDir = Join-Path $geminiRoot "archived_brain"
$archiveLogsDir = Join-Path $geminiRoot "archived_logs"

# Create directories
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Force -Path $backupDir | Out-Null }
if (-not (Test-Path $archiveSessionsDir)) { New-Item -ItemType Directory -Force -Path $archiveSessionsDir | Out-Null }
if (-not (Test-Path $archiveBrainDir)) { New-Item -ItemType Directory -Force -Path $archiveBrainDir | Out-Null }
if (-not (Test-Path $archiveLogsDir)) { New-Item -ItemType Directory -Force -Path $archiveLogsDir | Out-Null }

function Get-DirSize($path) {
    if (Test-Path $path) {
        $size = (Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        return [math]::Round($size / 1MB, 2)
    }
    return 0
}

Write-Host "Calculating initial sizes..."
$initialSize = Get-DirSize $geminiRoot
Write-Host "Initial total size: $initialSize MB"

Write-Host "Creating backup archive... (this might take a few moments)"
$foldersToBackup = @("conversations", "brain", "scratch", "implicit", "code_tracker")
$tempBackupDir = Join-Path $env:TEMP "antigravity_backup_temp"
if (Test-Path $tempBackupDir) { Remove-Item -Recurse -Force $tempBackupDir }
New-Item -ItemType Directory -Force -Path $tempBackupDir | Out-Null

foreach ($folder in $foldersToBackup) {
    $src = Join-Path $geminiRoot $folder
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $tempBackupDir -Recurse -Force
    }
}

Compress-Archive -Path "$tempBackupDir\*" -DestinationPath $backupFile -Force
Remove-Item -Recurse -Force $tempBackupDir
Write-Host "Backup created successfully at $backupFile"

Write-Host "Archiving sessions older than 7 days..."
$cutoffDate = (Get-Date).AddDays(-7)

# Archive conversations
$conversationsDir = Join-Path $geminiRoot "conversations"
if (Test-Path $conversationsDir) {
    $oldConversations = Get-ChildItem -Path $conversationsDir -File | Where-Object { $_.LastWriteTime -lt $cutoffDate }
    foreach ($file in $oldConversations) {
        Move-Item -Path $file.FullName -Destination $archiveSessionsDir -Force
    }
    Write-Host "Moved $($oldConversations.Count) old conversations."
}

# Archive brain
$brainDir = Join-Path $geminiRoot "brain"
if (Test-Path $brainDir) {
    $oldBrainDirs = Get-ChildItem -Path $brainDir -Directory | Where-Object { $_.LastWriteTime -lt $cutoffDate }
    foreach ($dir in $oldBrainDirs) {
        Move-Item -Path $dir.FullName -Destination $archiveBrainDir -Force
    }
    Write-Host "Moved $($oldBrainDirs.Count) old brain folders."
}

# Clean logs in code_tracker and scratch
$scratchDir = Join-Path $geminiRoot "scratch"
if (Test-Path $scratchDir) {
    $oldScratch = Get-ChildItem -Path $scratchDir -File | Where-Object { $_.LastWriteTime -lt $cutoffDate }
    foreach ($file in $oldScratch) {
        Move-Item -Path $file.FullName -Destination $archiveLogsDir -Force
    }
    Write-Host "Moved $($oldScratch.Count) old scratch logs."
}

$codeTrackerDir = Join-Path $geminiRoot "code_tracker"
if (Test-Path $codeTrackerDir) {
    $oldCodeTracker = Get-ChildItem -Path $codeTrackerDir -File | Where-Object { $_.LastWriteTime -lt $cutoffDate }
    foreach ($file in $oldCodeTracker) {
        Move-Item -Path $file.FullName -Destination $archiveLogsDir -Force
    }
    Write-Host "Moved $($oldCodeTracker.Count) old code tracker logs."
}

Write-Host "Calculating final sizes..."
$finalSize = Get-DirSize $geminiRoot
$savedSpace = $initialSize - $finalSize

Write-Host "----------------------------------------"
Write-Host "Cleanup Complete!"
Write-Host "Backup location: $backupFile"
Write-Host "Initial Size: $initialSize MB"
Write-Host "Final Size: $finalSize MB"
Write-Host "Space Transferred to Archives: $savedSpace MB"
Write-Host "----------------------------------------"
