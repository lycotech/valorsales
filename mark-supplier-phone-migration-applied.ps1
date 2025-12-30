# PowerShell script to mark supplier otherPhone migration as applied
# Run this AFTER manually running the SQL from prisma/manual-supplier-other-phone.sql

Write-Host "Marking supplier otherPhone migration as applied..." -ForegroundColor Yellow

# Migration name
$migrationName = "20251230120000_add_supplier_other_phone"

Write-Host "Marking migration as applied: $migrationName" -ForegroundColor Yellow

# Mark as applied
npx prisma migrate resolve --applied $migrationName

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration marked as applied successfully!" -ForegroundColor Green
    npx prisma migrate status
} else {
    Write-Host "Error marking migration as applied" -ForegroundColor Red
    exit 1
}

