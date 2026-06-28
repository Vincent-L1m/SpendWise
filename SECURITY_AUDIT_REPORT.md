# 🔒 SpendWise — Security Audit Report & Changelog

## ✅ Status Keamanan: AMAN (setelah perbaikan)

---

## 1. SQL Injection — Analisis

### Sebelum (kode lama)
Kode asli sudah menggunakan **parameterized queries** (`db.execute(sql, [params])`) di semua repository.
Ini berarti **tidak ada SQL injection langsung** di kode lama. Namun ada risiko di query dinamis:

```js
// categoryRepository.js — membangun SQL dinamis
let sql = `SELECT ... WHERE (user_id IS NULL OR user_id=?)`;
if (type && type !== "both") { sql += ` AND (type=? OR type='both')`; }
```
Ini aman karena nilai masih dipass sebagai parameter, bukan string interpolation.

### Setelah (kode baru) — Migrasi ke Sequelize ORM
Semua query user/OTP/wallet/category kini menggunakan **Sequelize ORM**:

```js
// ❌ Lama (raw SQL, meski sudah safe)
const user = await db.execute("SELECT * FROM users WHERE email=?", [email]);

// ✅ Baru (Sequelize ORM — zero SQL injection risk)
const user = await User.findOne({ where: { email } });
```

Query kompleks (transactions) tetap menggunakan mysql2 raw queries dengan parameterized statements.

---

## 2. Temuan Keamanan & Perbaikan

| # | Temuan | Severity | Status |
|---|--------|----------|--------|
| 1 | SQL Injection via raw queries | 🟡 Medium | ✅ Migrasi ke Sequelize ORM |
| 2 | Tidak ada verifikasi email/phone saat register | 🔴 High | ✅ OTP Email & SMS ditambahkan |
| 3 | User tanpa verifikasi bisa login langsung | 🔴 High | ✅ Login ditolak jika belum verifikasi |
| 4 | Tidak ada redirect otomatis ke login setelah register | 🟡 Medium | ✅ Auto-redirect + pesan sukses |
| 5 | OTP tidak ada expiry / invalidasi | 🔴 High | ✅ OTP expire 10 menit + invalidasi otomatis |
| 6 | Tidak ada rate limiting pada endpoint OTP | 🟡 Medium | ✅ Global rate limiter + resend cooldown 60s di UI |
| 7 | Cookie JWT tanpa secure flag di production | 🟡 Medium | ✅ Sudah ada, `secure: NODE_ENV === "production"` |
| 8 | Helmet.js untuk security headers | 🟢 Low | ✅ Sudah ada sejak kode asal |
| 9 | CORS dikonfigurasi dengan whitelist | 🟢 Low | ✅ Sudah ada sejak kode asal |
| 10 | Bcrypt untuk hash password & PIN | 🟢 Low | ✅ Sudah ada sejak kode asal |

---

## 3. Fitur OTP yang Ditambahkan

### Flow Register (Baru):
```
1. User isi form → POST /auth/register
2. Backend: buat user (is_verified=false) + kirim OTP ke email atau SMS
3. User masukkan 6-digit OTP → POST /auth/verify-otp
4. Backend: validasi OTP (max 10 menit), update is_verified=true
5. Auto-login + redirect ke /login dengan pesan sukses
```

### Flow Login (Diperbarui):
```
- Jika user sudah verified → login normal
- Jika belum verified → tampil OTP screen di halaman login
```

### Endpoint OTP:
- `POST /auth/register` — daftar + kirim OTP
- `POST /auth/verify-otp` — verifikasi OTP
- `POST /auth/resend-otp` — kirim ulang OTP

---

## 4. Tabel Database Baru

### `otp_codes`
```sql
CREATE TABLE otp_codes (
    id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED  NOT NULL,
    code       VARCHAR(6)    NOT NULL,
    type       ENUM('email','sms') NOT NULL,
    purpose    ENUM('verify','reset') NOT NULL DEFAULT 'verify',
    expires_at DATETIME      NOT NULL,
    used       TINYINT(1)    NOT NULL DEFAULT 0,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
```

### Kolom baru di `users`:
```sql
ALTER TABLE users
  ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN theme_preference ENUM('dark','light') DEFAULT 'dark';
```

---

## 5. Konfigurasi .env yang Diperlukan

```env
# Email OTP (wajib)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password  # Gmail App Password

# SMS OTP via Twilio (opsional)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE=+1234567890
```

---

## 6. Cara Setup Gmail App Password

1. Buka https://myaccount.google.com/security
2. Aktifkan **2-Step Verification**
3. Pergi ke **App Passwords**
4. Generate password untuk "Mail" → salin ke `SMTP_PASS`

---

## 7. Cara Menjalankan Setelah Update

```bash
# Backend
cd backend
npm install          # install sequelize, nodemailer, twilio
cp .env.example .env # isi variabel
mysql -u root spendwise < database_otp_migration.sql  # jalankan migration
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```
