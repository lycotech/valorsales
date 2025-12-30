# PowerShell script to mark all Prisma migrations as applied
# Run this after manually applying the database changes

$migrations = @(
    "20251201233616_init",
    "20251203071239_add_inventory_system",
    "20251203071250_add_inventory_system",
    "20251210094107_add_customer_credit_balance",
    "20251210103231_add_multi_product_sales",
    "20251230002756_update_customer_fields",
    "20251230002950_update_customer_fields",
    "20251230003020_update_customer_remove_address_add_contact"
)

foreach ($migration in $migrations) {
    Write-Host "Marking $migration as applied..."
    npx prisma migrate resolve --applied $migration
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error marking $migration as applied" -ForegroundColor Red
        exit 1
    }
}

Write-Host "All migrations marked as applied!" -ForegroundColor Green
npx prisma migrate status

