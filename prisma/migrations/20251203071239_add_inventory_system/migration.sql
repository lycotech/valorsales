-- CreateTable
CREATE TABLE `product_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `minimumStock` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `maximumStock` DECIMAL(10, 2) NULL,
    `reorderPoint` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'pcs',
    `lastRestockedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_inventory_productId_key`(`productId`),
    INDEX `product_inventory_productId_idx`(`productId`),
    INDEX `product_inventory_quantity_idx`(`quantity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raw_material_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `rawMaterialId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `minimumStock` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `maximumStock` DECIMAL(10, 2) NULL,
    `reorderPoint` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'kg',
    `lastRestockedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `raw_material_inventory_rawMaterialId_key`(`rawMaterialId`),
    INDEX `raw_material_inventory_rawMaterialId_idx`(`rawMaterialId`),
    INDEX `raw_material_inventory_quantity_idx`(`quantity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `productInventoryId` VARCHAR(191) NULL,
    `rawMaterialInventoryId` VARCHAR(191) NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `quantityChange` DECIMAL(10, 2) NOT NULL,
    `quantityBefore` DECIMAL(10, 2) NOT NULL,
    `quantityAfter` DECIMAL(10, 2) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `referenceType` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inventory_transactions_type_idx`(`type`),
    INDEX `inventory_transactions_productInventoryId_idx`(`productInventoryId`),
    INDEX `inventory_transactions_rawMaterialInventoryId_idx`(`rawMaterialInventoryId`),
    INDEX `inventory_transactions_transactionType_idx`(`transactionType`),
    INDEX `inventory_transactions_referenceId_idx`(`referenceId`),
    INDEX `inventory_transactions_createdAt_idx`(`createdAt`),
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
ALTER TABLE `sales` ADD CONSTRAINT `sales_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_payments` ADD CONSTRAINT `sale_payments_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_rawMaterialId_fkey` FOREIGN KEY (`rawMaterialId`) REFERENCES `raw_materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_payments` ADD CONSTRAINT `purchase_payments_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
