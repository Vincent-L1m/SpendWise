-- ================================================================
-- SpendWise — OTP & Verification Migration
-- Jalankan script ini untuk menambah fitur OTP ke database existing
-- ================================================================

USE spendwise;

-- Tambah kolom is_verified ke tabel users (jika belum ada)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar,
  ADD COLUMN IF NOT EXISTS theme_preference ENUM('dark','light') NOT NULL DEFAULT 'dark' AFTER salary_day;

-- Set semua user lama sebagai sudah terverifikasi (agar tidak perlu verifikasi ulang)
UPDATE users SET is_verified = 1 WHERE is_verified = 0;

-- Buat tabel OTP codes
CREATE TABLE IF NOT EXISTS otp_codes (
    id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED  NOT NULL,
    code       VARCHAR(6)    NOT NULL,
    type       ENUM('email','sms') NOT NULL DEFAULT 'email',
    purpose    ENUM('verify','reset') NOT NULL DEFAULT 'verify',
    expires_at DATETIME      NOT NULL,
    used       TINYINT(1)    NOT NULL DEFAULT 0,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_user    (user_id),
    INDEX idx_otp_lookup  (user_id, code, type, purpose, used, expires_at),
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration OTP berhasil! ✅' AS status;
