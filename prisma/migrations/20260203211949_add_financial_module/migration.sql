-- CreateTable
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

-- CreateTable
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

-- AddForeignKey
ALTER TABLE `supplier_items` ADD CONSTRAINT `supplier_items_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_inventory` ADD CONSTRAINT `product_inventory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raw_material_inventory` ADD CONSTRAINT `raw_material_inventory_rawMaterialId_fkey` FOREIGN KEY (`rawMaterialId`) REFERENCES `raw_materials`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_productInventoryId_fkey` FOREIGN KEY (`productInventoryId`) REFERENCES `product_inventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_rawMaterialInventoryId_fkey` FOREIGN KEY (`rawMaterialInventoryId`) REFERENCES `raw_material_inventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_payments` ADD CONSTRAINT `sale_payments_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_rawMaterialId_fkey` FOREIGN KEY (`rawMaterialId`) REFERENCES `raw_materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_payments` ADD CONSTRAINT `purchase_payments_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
