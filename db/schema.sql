-- MySQL schema for Shine On
-- Requires MySQL 8.0+ (JSON columns, utf8mb4)

-- Safety: adjust database name if you prefer
CREATE DATABASE IF NOT EXISTS shine_on
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE shine_on;

-- Users table (local auth: firstname, surname, username, password)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  firstname VARCHAR(191) NOT NULL,
  surname VARCHAR(191) NOT NULL,
  username VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily checklists (one per date per user)
CREATE TABLE IF NOT EXISTS checklists (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  supplements JSON NULL, -- array of objects: [{ name, dosage, time, completed, notes }]
  notes TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_checklists_user_date (user_id, date),
  KEY idx_checklists_date (date),
  CONSTRAINT fk_checklists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Treatments
CREATE TABLE IF NOT EXISTS treatments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(64) NULL, -- optional: maps to client-generated id (e.g., Date.now())
  date DATE NULL,
  type VARCHAR(100) NULL,
  clinic VARCHAR(191) NULL,
  notes TEXT NULL,
  attachments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_treatments_external_id (external_id),
  KEY idx_treatments_user_date (user_id, date),
  CONSTRAINT fk_treatments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Future Plans
CREATE TABLE IF NOT EXISTS future_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(64) NULL, -- optional: maps to client-generated id (e.g., Date.now())
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NULL,
  priority ENUM('Low','Medium','High') NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  due_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_future_plans_external_id (external_id),
  KEY idx_future_plans_user_completed (user_id, completed),
  CONSTRAINT fk_future_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reflections (daily free-form entry)
CREATE TABLE IF NOT EXISTS reflections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  content JSON NULL, -- free-form, e.g., { mood, text }
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reflections_user_date (user_id, date),
  CONSTRAINT fk_reflections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Goals (generic goal tracking; fields are intentionally flexible)
CREATE TABLE IF NOT EXISTS goals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('not_started','in_progress','completed','archived') NOT NULL DEFAULT 'not_started',
  priority ENUM('low','medium','high') NULL,
  due_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goals_user_status (user_id, status),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metadata (generic key/value per user; used by features like Investigations storage)
CREATE TABLE IF NOT EXISTS metadata (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  value JSON NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_metadata_user_key (user_id, `key`),
  CONSTRAINT fk_metadata_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Investigations (research tracking, see investigations.js)
CREATE TABLE IF NOT EXISTS investigations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(64) NULL, -- optional: maps to client side id
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NULL,
  priority ENUM('Low','Medium','High') NULL,
  status ENUM('New','Reviewed','Pursuing','Archived') NULL,
  rating TINYINT UNSIGNED NULL, -- 0-5
  source VARCHAR(255) NULL,
  contact VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  location VARCHAR(255) NULL,
  notes TEXT NULL,
  tags JSON NULL, -- array of strings or null
  date_added TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_investigations_user_status (user_id, status),
  KEY idx_investigations_user_priority (user_id, priority),
  CONSTRAINT fk_investigations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nutrition Tips
CREATE TABLE IF NOT EXISTS nutrition_tips (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NULL,
  details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nutrition_tips_user (user_id),
  CONSTRAINT fk_nutrition_tips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nutrition Recipes
CREATE TABLE IF NOT EXISTS nutrition_recipes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  category ENUM('Breakfast','Lunch','Dinner','Snacks') NOT NULL,
  ingredients JSON NULL, -- array of strings
  instructions TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nutrition_recipes_user_cat (user_id, category),
  CONSTRAINT fk_nutrition_recipes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes:
-- 1) JSON columns require MySQL 5.7+ (recommended 8.0+). If not available, 
--    change JSON columns to TEXT and store serialized JSON.
-- 2) The external_id columns allow you to map existing client-generated IDs (like Date.now()).
-- 3) Add additional indexes based on your query patterns as needed.
