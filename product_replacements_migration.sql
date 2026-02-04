-- Product Replacements Migration
-- Run this SQL script on your production database: cnbezvte_valorsales

-- Create product_replacements table
CREATE TABLE `product_replacements` (
    `id` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_replacements_saleId_idx`(`saleId`),
    INDEX `product_replacements_productId_idx`(`productId`),
    INDEX `product_replacements_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `product_replacements` ADD CONSTRAINT `product_replacements_saleId_fkey` 
    FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `product_replacements` ADD CONSTRAINT `product_replacements_productId_fkey` 
    FOREIGN KEY (`productId`) REFERENCES `products`(`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Mark migration as applied in Prisma's migration table
INSERT INTO `_prisma_migrations` 
    (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES 
    (UUID(), 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2', NOW(), '20260204080341_add_product_replacements', NULL, NULL, NOW(), 1);
