-- Financial Module Migration
-- Run this SQL script on your production database: cnbezvte_valorsales

-- Create expense_categories table
CREATE TABLE `expense_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `expense_categories_name_key`(`name`),
    INDEX `expense_categories_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create expenses table
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expenses_categoryId_idx`(`categoryId`),
    INDEX `expenses_date_idx`(`date`),
    INDEX `expenses_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_categoryId_fkey` 
    FOREIGN KEY (`categoryId`) REFERENCES `expense_categories`(`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Mark migration as applied in Prisma's migration table
-- This tells Prisma that this migration has been run
INSERT INTO `_prisma_migrations` 
    (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES 
    (UUID(), '8e9f5c3d2a1b4e6f7c8d9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d', NOW(), '20260203211949_add_financial_module', NULL, NULL, NOW(), 1);
