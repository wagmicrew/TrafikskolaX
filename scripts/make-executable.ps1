# Make database cleanup scripts executable (Windows)
# Run this script to set up the database cleanup environment

Write-Host "🔧 Setting up database cleanup scripts..." -ForegroundColor Green

# Check if scripts exist
$scripts = @(
    "remove-safe-tables.js",
    "verify-table-removal.js",
    "dry-run-table-removal.js"
)

foreach ($script in $scripts) {
    $scriptPath = Join-Path $PSScriptRoot $script
    if (Test-Path $scriptPath) {
        Write-Host "✅ Found $script" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing $script" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Available commands:" -ForegroundColor Cyan
Write-Host "  • node scripts/dry-run-table-removal.js     - See what would happen" -ForegroundColor White
Write-Host "  • node scripts/verify-table-removal.js      - Check database state" -ForegroundColor White
Write-Host "  • node scripts/remove-safe-tables.js --yes  - Perform actual removal" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Yellow
Write-Host "  • scripts/README-table-removal.md" -ForegroundColor White
Write-Host "  • Documentation_new/database-tables-analysis.md" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important:" -ForegroundColor Red
Write-Host "  • Always create a database backup before removing tables!" -ForegroundColor White
Write-Host "  • Run dry-run and verification scripts first!" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Ready to proceed with database cleanup!" -ForegroundColor Green
