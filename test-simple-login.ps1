# Simple login test
$baseUrl = "https://dev.dintrafikskolahlm.se"

Write-Host "🧪 Testing admin login..." -ForegroundColor Cyan

$body = @{
    email = "admin@test.se"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host "   Role: $($response.user.role)" -ForegroundColor White
        Write-Host "   Name: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
        Write-Host "   Redirect: $($response.redirectUrl)" -ForegroundColor White
    } else {
        Write-Host "❌ Login failed: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
