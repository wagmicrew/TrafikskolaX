try {
    Write-Host "Running database migration..."
    $response = Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/admin/migrate" -UseBasicParsing
    Write-Host "Migration response:"
    Write-Host $response.Content
} catch {
    Write-Host "Error running migration: $($_.Exception.Message)"
}
