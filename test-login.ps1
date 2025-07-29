# Test login functionality with PowerShell
$baseUrl = "https://dev.dintrafikskolahlm.se"

function Test-Login {
    param(
        [string]$email,
        [string]$password,
        [string]$expectedRole
    )
    
    Write-Host "`n🧪 Testing login for $email ($expectedRole)..." -ForegroundColor Cyan
    
    try {
        $body = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ Login successful for $email" -ForegroundColor Green
            Write-Host "   Role: $($response.user.role)" -ForegroundColor White
            Write-Host "   Name: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
            Write-Host "   Redirect URL: $($response.redirectUrl)" -ForegroundColor White
            Write-Host "   Token: $($response.token.Substring(0, 20))..." -ForegroundColor White
            
            # Test token verification
            try {
                $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/verify" -Method POST -Headers @{
                    "Authorization" = "Bearer $($response.token)"
                    "Content-Type" = "application/json"
                }
                
                if ($verifyResponse.success) {
                    Write-Host "✅ Token verification successful" -ForegroundColor Green
                    Write-Host "   Verified user: $($verifyResponse.user.email) ($($verifyResponse.user.role))" -ForegroundColor White
                } else {
                    Write-Host "❌ Token verification failed: $($verifyResponse.error)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Token verification error: $($_.Exception.Message)" -ForegroundColor Red
            }
            
        } else {
            Write-Host "❌ Login failed for $email`: $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error testing login for $email`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "🚀 Testing login functionality..." -ForegroundColor Yellow

# Test all user types
Test-Login -email "admin@test.se" -password "password123" -expectedRole "admin"
Test-Login -email "teacher@test.se" -password "password123" -expectedRole "teacher"
Test-Login -email "student@test.se" -password "password123" -expectedRole "student"

# Test invalid credentials
Test-Login -email "invalid@test.se" -password "wrongpassword" -expectedRole "none"

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
