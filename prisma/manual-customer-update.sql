-- Manual migration script for customer table updates
-- Run this SQL directly on your production database via phpMyAdmin or MySQL client
-- 
-- IMPORTANT: Check your database structure first before running!
-- You can check if columns exist by running: DESCRIBE `customers`;

-- Step 1: Add new columns (run only if columns don't exist)
-- Check first: SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'contactPerson';
-- If the query returns empty, run:
ALTER TABLE `customers` 
  ADD COLUMN `contactPerson` VARCHAR(191) NULL,
  ADD COLUMN `contactPersonPhone` VARCHAR(191) NULL;

-- Step 2: Modify location column to TEXT
-- This is safe to run even if already TEXT
ALTER TABLE `customers` 
  MODIFY COLUMN `location` TEXT NOT NULL;

-- Step 3: Drop address column (ONLY if it exists and you want to remove it)
-- WARNING: This will permanently delete all address data!
-- First check if column exists: SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'address';
-- If the query returns a result, and you want to remove it, uncomment:
-- ALTER TABLE `customers` DROP COLUMN `address`;

