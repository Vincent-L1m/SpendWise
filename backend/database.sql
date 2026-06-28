-- ================================================================
-- SpendWise — Database Schema v2
-- Compatible: MySQL 5.7+ / MariaDB 10.3+ (XAMPP ready)
-- ================================================================

CREATE DATABASE IF NOT EXISTS spendwise
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spendwise;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    fullname        VARCHAR(100)  NOT NULL,
    username        VARCHAR(50)   NOT NULL UNIQUE,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    phone           VARCHAR(20)   DEFAULT NULL,
    password        VARCHAR(255)  NOT NULL,
    avatar          VARCHAR(255)  DEFAULT NULL,
    -- Salary cycle settings
    salary_cycle_enabled  TINYINT(1)   NOT NULL DEFAULT 0,
    salary_day           TINYINT      NOT NULL DEFAULT 1,  -- 1-31
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── user_security ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_security (
    id                INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    user_id           INT UNSIGNED  NOT NULL UNIQUE,
    pin               VARCHAR(255)  DEFAULT NULL,
    biometric_enabled TINYINT(1)    NOT NULL DEFAULT 0,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── wallets ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
    id          INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    name        VARCHAR(100)   NOT NULL,
    type        ENUM('cash','bank','ewallet','investment','other') NOT NULL DEFAULT 'cash',
    balance     DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
    color       VARCHAR(20)    NOT NULL DEFAULT '#00d4ff',
    icon        VARCHAR(50)    NOT NULL DEFAULT 'wallet',
    is_default  TINYINT(1)     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED   DEFAULT NULL,
    name       VARCHAR(100)   NOT NULL,
    type       ENUM('income','expense','both') NOT NULL DEFAULT 'both',
    icon       VARCHAR(50)    NOT NULL DEFAULT 'tag',
    color      VARCHAR(20)    NOT NULL DEFAULT '#00d4ff',
    is_custom  TINYINT(1)     NOT NULL DEFAULT 0,
    created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── transactions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id               INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNSIGNED   NOT NULL,
    wallet_id        INT UNSIGNED   NOT NULL,
    to_wallet_id     INT UNSIGNED   DEFAULT NULL,
    category_id      INT UNSIGNED   DEFAULT NULL,
    type             ENUM('income','expense','transfer') NOT NULL,
    amount           DECIMAL(15,2)  NOT NULL,
    fee              DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
    note             VARCHAR(255)   DEFAULT NULL,
    transaction_date DATE           NOT NULL,
    created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trx_user      FOREIGN KEY (user_id)      REFERENCES users(id)       ON DELETE CASCADE,
    CONSTRAINT fk_trx_wallet    FOREIGN KEY (wallet_id)    REFERENCES wallets(id)     ON DELETE CASCADE,
    CONSTRAINT fk_trx_to_wallet FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)     ON DELETE SET NULL,
    CONSTRAINT fk_trx_category  FOREIGN KEY (category_id)  REFERENCES categories(id)  ON DELETE SET NULL,
    INDEX idx_user_date (user_id, transaction_date),
    INDEX idx_user_type (user_id, type),
    INDEX idx_wallet    (wallet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Default categories ────────────────────────────────────────
INSERT INTO categories (name, type, icon, color, is_custom) VALUES
('Gaji',         'income',  'briefcase',      '#00e5a0', 0),
('Bonus',        'income',  'gift',            '#00e5a0', 0),
('Freelance',    'income',  'code',            '#00e5a0', 0),
('Investasi',    'income',  'trending-up',     '#00e5a0', 0),
('Hadiah',       'income',  'gift',            '#00d4ff', 0),
('Lainnya',      'income',  'plus-circle',     '#8ba3c7', 0),
('Makanan',      'expense', 'coffee',          '#ff4d6d', 0),
('Transportasi', 'expense', 'truck',           '#f59e0b', 0),
('Belanja',      'expense', 'shopping-bag',    '#7c3aed', 0),
('Kesehatan',    'expense', 'heart',           '#ff4d6d', 0),
('Hiburan',      'expense', 'film',            '#00d4ff', 0),
('Pendidikan',   'expense', 'book',            '#00e5a0', 0),
('Tagihan',      'expense', 'file-text',       '#f59e0b', 0),
('Kost/Sewa',    'expense', 'home',            '#7c3aed', 0),
('Bensin',       'expense', 'zap',             '#f59e0b', 0),
('Lainnya',      'expense', 'more-horizontal', '#8ba3c7', 0);

COMMIT;

-- ── budgets (Budget Limit per Kategori) ────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
    id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED  NOT NULL,
    category_id INT UNSIGNED  NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    month       TINYINT       NOT NULL,  -- 1-12
    year        SMALLINT      NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_budget (user_id, category_id, month, year),
    CONSTRAINT fk_budget_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── reminders (Notifikasi Reminder Tagihan) ─────────────────────
CREATE TABLE IF NOT EXISTS reminders (
    id          INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    title       VARCHAR(150)   NOT NULL,
    amount      DECIMAL(15,2)  DEFAULT NULL,
    due_date    DATE           NOT NULL,
    repeat_type ENUM('none','monthly','weekly','yearly') NOT NULL DEFAULT 'none',
    is_paid     TINYINT(1)     NOT NULL DEFAULT 0,
    notes       VARCHAR(255)   DEFAULT NULL,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_due (user_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── recurring_transactions (Transaksi Berulang) ─────────────────
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id              INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED   NOT NULL,
    wallet_id       INT UNSIGNED   NOT NULL,
    to_wallet_id    INT UNSIGNED   DEFAULT NULL,
    category_id     INT UNSIGNED   DEFAULT NULL,
    type            ENUM('income','expense','transfer') NOT NULL,
    amount          DECIMAL(15,2)  NOT NULL,
    fee             DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
    note            VARCHAR(255)   DEFAULT NULL,
    frequency       ENUM('daily','weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
    interval_count  INT            NOT NULL DEFAULT 1,
    start_date      DATE           NOT NULL,
    end_date        DATE           DEFAULT NULL,
    next_run_date   DATE           NOT NULL,
    is_active       TINYINT(1)     NOT NULL DEFAULT 1,
    last_run_at     TIMESTAMP      DEFAULT NULL,
    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_recurring_user      FOREIGN KEY (user_id)      REFERENCES users(id)       ON DELETE CASCADE,
    CONSTRAINT fk_recurring_wallet    FOREIGN KEY (wallet_id)    REFERENCES wallets(id)     ON DELETE CASCADE,
    CONSTRAINT fk_recurring_to_wallet FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)     ON DELETE SET NULL,
    CONSTRAINT fk_recurring_category  FOREIGN KEY (category_id)  REFERENCES categories(id)  ON DELETE SET NULL,
    INDEX idx_next_run (user_id, next_run_date, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── theme_preference (Dark/Light Mode) ──────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS theme_preference ENUM('dark','light') NOT NULL DEFAULT 'dark'
  AFTER salary_day;

COMMIT;
