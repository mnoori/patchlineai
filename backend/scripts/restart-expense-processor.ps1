# Restart Expense Processor Server
# This script stops any running expense processor and starts it fresh

Write-Host "Restarting Expense Processor Server..." -ForegroundColor Cyan

# Find and kill any existing expense processor
$processes = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*expense-processor-server.py*"
}

if ($processes) {
    Write-Host "Stopping existing expense processor..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Start new expense processor
Write-Host "Starting expense processor server..." -ForegroundColor Green
$scriptPath = Join-Path $PSScriptRoot "expense-processor-server.py"

Start-Process python -ArgumentList $scriptPath -WindowStyle Normal

Write-Host "`nExpense processor server started!" -ForegroundColor Green
Write-Host "Check the new window for server logs." -ForegroundColor Cyan
Write-Host "`nNow you can run:" -ForegroundColor Yellow
Write-Host "  python smart-receipt-processor.py" -ForegroundColor White
Write-Host "or" -ForegroundColor Yellow
Write-Host "  python process-creative-cloud.py" -ForegroundColor White 