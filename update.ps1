# Sync all local changes to GitHub for auto-deployment on Render
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-Update: $timestamp"
git push
Write-Host "✅ Changes pushed! Render is now updating your live site automatically..." -ForegroundColor Green
