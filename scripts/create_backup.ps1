param(
  [string]$ts
)
if (-not $ts) { $ts = Get-Date -Format yyyyMMdd-HHmmss }
$backupDir = "backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$zipPath = Join-Path $backupDir ("backup-$ts.zip")
# Collect files excluding .git and backups
Write-Output "Collecting files to backup..."
$files = Get-ChildItem -Recurse -Force | Where-Object {
    -not ($_.FullName -match "\\.git") -and -not ($_.FullName -match "\\\\backups")
} | Select-Object -ExpandProperty FullName
Write-Output ("Files collected: {0}" -f $files.Count)
try {
    Write-Output "Starting compression to $zipPath..."
    Compress-Archive -LiteralPath $files -DestinationPath $zipPath -Force -ErrorAction Stop
    Write-Output "Created: $zipPath"
} catch {
    Write-Output "Compression failed: $_"
    exit 1
}
# Git operations
try {
    git fetch origin
} catch {
    Write-Output "git fetch failed: $_"
}
$branchName = "backup/$ts"
# Create branch from current HEAD
try {
    git checkout -b $branchName
} catch {
    Write-Output "git checkout failed: $_"
}
try {
    git add -A
    $commit = git commit -m "backup: snapshot $ts" 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Output 'Committed backup branch' } else { Write-Output 'No changes to commit' }
} catch {
    Write-Output "git commit/add failed: $_"
}
try {
    git push origin HEAD:refs/heads/$branchName
    Write-Output "Pushed backup branch $branchName"
} catch {
    Write-Output "git push failed: $_"
}
