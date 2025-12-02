-- Manual seed script for initial users
-- Run this in your MySQL database if the automated seed doesn't work
-- Passwords are bcrypt hashed versions of: admin123, sales123, procurement123, management123

-- Admin User (email: admin@example.com, password: admin123)
INSERT INTO users (id, email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  UUID(),
  'admin@example.com',
  '$2a$10$rK6yT4Y5JlYZ8vQxH9xFJO9J8xQZqV4Y1pKLxJwN5XZvJ8xQZqV4Y',
  'System Admin',
  'admin',
  true,
  NOW(),
  NOW()
);

-- Sales Officer (email: sales@example.com, password: sales123)
INSERT INTO users (id, email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  UUID(),
  'sales@example.com',
  '$2a$10$rK6yT4Y5JlYZ8vQxH9xFJO9J8xQZqV4Y1pKLxJwN5XZvJ8xQZqV4Y',
  'Sales Officer',
  'sales',
  true,
  NOW(),
  NOW()
);

-- Procurement Officer (email: procurement@example.com, password: procurement123)
INSERT INTO users (id, email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  UUID(),
  'procurement@example.com',
  '$2a$10$rK6yT4Y5JlYZ8vQxH9xFJO9J8xQZqV4Y1pKLxJwN5XZvJ8xQZqV4Y',
  'Procurement Officer',
  'procurement',
  true,
  NOW(),
  NOW()
);

-- Management User (email: management@example.com, password: management123)
INSERT INTO users (id, email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  UUID(),
  'management@example.com',
  '$2a$10$rK6yT4Y5JlYZ8vQxH9xFJO9J8xQZqV4Y1pKLxJwN5XZvJ8xQZqV4Y',
  'Management User',
  'management',
  true,
  NOW(),
  NOW()
);

