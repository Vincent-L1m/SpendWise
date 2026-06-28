-- ================================================================
-- SpendWise — Migration Script (untuk database yang sudah ada)
-- Jalankan ini jika sudah punya database spendwise sebelumnya
-- ================================================================
USE spendwise;

-- Tambah kolom fee ke transactions (jika belum ada)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) NOT NULL DEFAULT 0.00
  AFTER amount;

-- Tambah kolom salary cycle ke users (jika belum ada)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS salary_cycle_enabled TINYINT(1) NOT NULL DEFAULT 0
  AFTER avatar;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS salary_day TINYINT NOT NULL DEFAULT 1
  AFTER salary_cycle_enabled;

-- ── Sprint 6 migrations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
    id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED  NOT NULL,
    category_id INT UNSIGNED  NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    month       TINYINT       NOT NULL,
    year        SMALLINT      NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_budget (user_id, category_id, month, year),
    CONSTRAINT fk_budget_user2     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT fk_budget_category2 FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_reminder_user2 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_due2 (user_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_recurring_user2      FOREIGN KEY (user_id)      REFERENCES users(id)       ON DELETE CASCADE,
    CONSTRAINT fk_recurring_wallet2    FOREIGN KEY (wallet_id)    REFERENCES wallets(id)     ON DELETE CASCADE,
    CONSTRAINT fk_recurring_to_wallet2 FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)     ON DELETE SET NULL,
    CONSTRAINT fk_recurring_category2  FOREIGN KEY (category_id)  REFERENCES categories(id)  ON DELETE SET NULL,
    INDEX idx_next_run2 (user_id, next_run_date, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS theme_preference ENUM('dark','light') NOT NULL DEFAULT 'dark'
  AFTER salary_day;
