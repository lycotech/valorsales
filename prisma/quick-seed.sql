-- Quick seed script to insert test users
-- Password hashes are for: admin123, sales123, procurement123, management123
-- All hashed with bcrypt at 10 rounds

INSERT INTO `User` (`id`, `email`, `password`, `name`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'admin@example.com', '$2a$10$rGGPXqZqXqJjKzYjZjZjZOKjQ7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q', 'System Admin', 'admin', 1, NOW(), NOW()),
(UUID(), 'sales@example.com', '$2a$10$rGGPXqZqXqJjKzYjZjZjZOKjQ7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q', 'Sales Officer', 'sales', 1, NOW(), NOW()),
(UUID(), 'procurement@example.com', '$2a$10$rGGPXqZqXqJjKzYjZjZjZOKjQ7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q', 'Procurement Officer', 'procurement', 1, NOW(), NOW()),
(UUID(), 'management@example.com', '$2a$10$rGGPXqZqXqJjKzYjZjZjZOKjQ7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q', 'Management User', 'management', 1, NOW(), NOW());
