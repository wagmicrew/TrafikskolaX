# Test login with curl
Write-Host "🧪 Testing login with curl..." -ForegroundColor Cyan

$body = '{"email":"admin@test.se","password":"password123"}'
$url = "https://dev.dintrafikskolahlm.se/api/auth/login"

try {
    $response = & curl.exe -X POST -H "Content-Type: application/json" -d $body $url --silent --show-error
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $response -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
