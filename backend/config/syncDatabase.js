require("dotenv").config();
const mysql2 = require("mysql2/promise");

const DEFAULT_CATEGORIES = [
  { name: "Gaji", type: "income", icon: "briefcase", color: "#00e5a0" },
  { name: "Bonus", type: "income", icon: "gift", color: "#00e5a0" },
  { name: "Freelance", type: "income", icon: "code", color: "#00e5a0" },
  { name: "Investasi", type: "income", icon: "trending-up", color: "#00e5a0" },
  { name: "Hadiah", type: "income", icon: "gift", color: "#00d4ff" },
  { name: "Lainnya", type: "income", icon: "plus-circle", color: "#8ba3c7" },
  { name: "Makanan", type: "expense", icon: "coffee", color: "#ff4d6d" },
  { name: "Transportasi", type: "expense", icon: "truck", color: "#f59e0b" },
  { name: "Belanja", type: "expense", icon: "shopping-bag", color: "#7c3aed" },
  { name: "Kesehatan", type: "expense", icon: "heart", color: "#ff4d6d" },
  { name: "Hiburan", type: "expense", icon: "film", color: "#00d4ff" },
  { name: "Pendidikan", type: "expense", icon: "book", color: "#00e5a0" },
  { name: "Tagihan", type: "expense", icon: "file-text", color: "#f59e0b" },
  { name: "Kost/Sewa", type: "expense", icon: "home", color: "#7c3aed" },
  { name: "Bensin", type: "expense", icon: "zap", color: "#f59e0b" },
  { name: "Lainnya", type: "expense", icon: "more-horizontal", color: "#8ba3c7" },
];

const syncDatabase = async () => {
  const dbName = process.env.DB_NAME || "spendwise";
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const pass = process.env.DB_PASSWORD || "";
  const port = process.env.DB_PORT || 3306;

  // ── 1. Buat database jika belum ada ──────────────────────────
  const tempConn = await mysql2.createConnection({ host, port, user, password: pass });
  await tempConn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await tempConn.end();
  console.log(`✅ Database "${dbName}" siap`);

  // ── 2. Koneksi ke database target ────────────────────────────
  const db = await mysql2.createConnection({
    host, port, user, password: pass, database: dbName, multipleStatements: true,
  });

  // ── 3. Buat semua tabel dengan CREATE TABLE IF NOT EXISTS ─────
  //       Tidak pakai ALTER sehingga tidak menumpuk index.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      fullname             VARCHAR(100)  NOT NULL,
      username             VARCHAR(50)   NOT NULL,
      email                VARCHAR(150)  NOT NULL,
      phone                VARCHAR(20)   DEFAULT NULL,
      password             VARCHAR(255)  NOT NULL,
      avatar               VARCHAR(255)  DEFAULT NULL,
      is_verified          TINYINT(1)    NOT NULL DEFAULT 0,
      salary_cycle_enabled TINYINT(1)    NOT NULL DEFAULT 0,
      salary_day           TINYINT       NOT NULL DEFAULT 1,
      theme_preference     ENUM('dark','light') NOT NULL DEFAULT 'dark',
      created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_users_username (username),
      UNIQUE KEY uq_users_email    (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_security (
      id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id           INT UNSIGNED NOT NULL,
      pin               VARCHAR(255) DEFAULT NULL,
      biometric_enabled TINYINT(1)   NOT NULL DEFAULT 0,
      created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_security_user (user_id),
      CONSTRAINT fk_usec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id    INT UNSIGNED NOT NULL,
      code       VARCHAR(6)   NOT NULL,
      type       ENUM('email','sms') NOT NULL,
      purpose    ENUM('verify','reset') NOT NULL DEFAULT 'verify',
      expires_at DATETIME     NOT NULL,
      used       TINYINT(1)   NOT NULL DEFAULT 0,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_otp_user (user_id),
      CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS wallets (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id    INT UNSIGNED NOT NULL,
      name       VARCHAR(100) NOT NULL,
      type       ENUM('cash','bank','ewallet','investment','other') NOT NULL DEFAULT 'cash',
      balance    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      color      VARCHAR(20)  NOT NULL DEFAULT '#00d4ff',
      icon       VARCHAR(50)  NOT NULL DEFAULT 'wallet',
      is_default TINYINT(1)   NOT NULL DEFAULT 0,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_wallets_user (user_id),
      CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id   INT UNSIGNED DEFAULT NULL,
      name      VARCHAR(100) NOT NULL,
      type      ENUM('income','expense','both') NOT NULL DEFAULT 'both',
      icon      VARCHAR(50)  NOT NULL DEFAULT 'tag',
      color     VARCHAR(20)  NOT NULL DEFAULT '#00d4ff',
      is_custom TINYINT(1)   NOT NULL DEFAULT 0,
      KEY idx_categories_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id          INT UNSIGNED NOT NULL,
      wallet_id        INT UNSIGNED NOT NULL,
      to_wallet_id     INT UNSIGNED DEFAULT NULL,
      category_id      INT UNSIGNED DEFAULT NULL,
      type             ENUM('income','expense','transfer') NOT NULL,
      amount           DECIMAL(15,2) NOT NULL,
      fee              DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      note             VARCHAR(255)  DEFAULT NULL,
      receipt_image    VARCHAR(500)  DEFAULT NULL,
      transaction_date DATE          NOT NULL,
      created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_trx_user_date (user_id, transaction_date),
      KEY idx_trx_wallet    (wallet_id),
      CONSTRAINT fk_trx_user   FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
      CONSTRAINT fk_trx_wallet FOREIGN KEY (wallet_id)    REFERENCES wallets(id)    ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id      INT UNSIGNED NOT NULL,
      category_id  INT UNSIGNED NOT NULL,
      amount       DECIMAL(15,2) NOT NULL,
      month        TINYINT       NOT NULL,
      year         SMALLINT      NOT NULL,
      notified_80  TINYINT(1)    NOT NULL DEFAULT 0,
      notified_100 TINYINT(1)    NOT NULL DEFAULT 0,
      created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_budget (user_id, category_id, month, year),
      CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reminders (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      title       VARCHAR(150) NOT NULL,
      amount      DECIMAL(15,2) DEFAULT NULL,
      due_date    DATE          NOT NULL,
      repeat_type ENUM('none','monthly','weekly','yearly') NOT NULL DEFAULT 'none',
      is_paid     TINYINT(1)    NOT NULL DEFAULT 0,
      notes       VARCHAR(255)  DEFAULT NULL,
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_reminders_user_date (user_id, due_date),
      CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id         INT UNSIGNED NOT NULL,
      wallet_id       INT UNSIGNED NOT NULL,
      to_wallet_id    INT UNSIGNED DEFAULT NULL,
      category_id     INT UNSIGNED DEFAULT NULL,
      type            ENUM('income','expense','transfer') NOT NULL,
      amount          DECIMAL(15,2) NOT NULL,
      fee             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      note            VARCHAR(255)  DEFAULT NULL,
      frequency       ENUM('daily','weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
      interval_count  INT           NOT NULL DEFAULT 1,
      start_date      DATE          NOT NULL,
      end_date        DATE          DEFAULT NULL,
      next_run_date   DATE          NOT NULL,
      is_active       TINYINT(1)    NOT NULL DEFAULT 1,
      last_run_at     DATETIME      DEFAULT NULL,
      created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_recurring_run (user_id, next_run_date, is_active),
      CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id        INT UNSIGNED  NOT NULL,
      name           VARCHAR(100)  NOT NULL,
      target_amount  DECIMAL(15,2) NOT NULL,
      current_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      target_date    DATE          DEFAULT NULL,
      icon           VARCHAR(10)   NOT NULL DEFAULT '🎯',
      color          VARCHAR(20)   NOT NULL DEFAULT '#00e5a0',
      is_completed   TINYINT(1)    NOT NULL DEFAULT 0,
      created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_savings_user (user_id),
      CONSTRAINT fk_savings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS split_bills (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id      INT UNSIGNED  NOT NULL,
      title        VARCHAR(150)  NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      note         VARCHAR(255)  DEFAULT NULL,
      is_settled   TINYINT(1)    NOT NULL DEFAULT 0,
      created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_splitbill_user (user_id),
      CONSTRAINT fk_splitbill_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS split_bill_members (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      split_bill_id INT UNSIGNED  NOT NULL,
      name          VARCHAR(100)  NOT NULL,
      amount        DECIMAL(15,2) NOT NULL,
      is_paid       TINYINT(1)    NOT NULL DEFAULT 0,
      KEY idx_sbm_bill (split_bill_id),
      CONSTRAINT fk_sbm_bill FOREIGN KEY (split_bill_id) REFERENCES split_bills(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("✅ Semua tabel berhasil disinkronisasi");

  // ── 4. Seed kategori default jika belum ada ───────────────────
  const [[{ cnt }]] = await db.execute("SELECT COUNT(*) as cnt FROM categories WHERE is_custom = 0");
  if (Number(cnt) === 0) {
    const placeholders = DEFAULT_CATEGORIES.map(() => "(?,?,?,?,0)").join(",");
    const values = DEFAULT_CATEGORIES.flatMap(c => [c.name, c.type, c.icon, c.color]);
    await db.execute(
      `INSERT INTO categories (name, type, icon, color, is_custom) VALUES ${placeholders}`,
      values
    );
    console.log(`✅ ${DEFAULT_CATEGORIES.length} kategori default ditambahkan`);
  } else {
    console.log(`ℹ️  Kategori sudah ada, skip seed`);
  }

  await db.end();
};

module.exports = syncDatabase;