-- Manual migration script for supplier otherPhone field
-- Run this SQL directly on your production database via phpMyAdmin or MySQL client
-- 
-- IMPORTANT: Check your database structure first before running!
-- You can check if column exists by running: DESCRIBE `suppliers`;

-- Add otherPhone column to suppliers table
-- This is safe to run even if column already exists (will show error if exists, which is fine)
ALTER TABLE `suppliers` 
  ADD COLUMN `otherPhone` VARCHAR(191) NULL;

-- Verify the column was added:
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'otherPhone';

