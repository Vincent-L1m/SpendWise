# SpendWise — Budget & Expense Tracker

Aplikasi manajemen keuangan pribadi dengan desain futuristik.
**Node.js + Express** (backend) · **React + Vite** (frontend)

---

## ⚙️ Yang Dibutuhkan

| Tool | Versi |
|---|---|
| **XAMPP** (MySQL + Apache) | Terbaru — https://www.apachefriends.org |
| **Node.js** | v18+ — https://nodejs.org |

---

## 🗄️ Setup Database (phpMyAdmin / XAMPP)

1. Buka XAMPP Control Panel → **Start** Apache & MySQL
2. Buka browser → `http://localhost/phpmyadmin`
3. Klik tab **"Import"** → pilih `backend/database.sql` → klik **"Go"** ✅

> **Sudah punya database lama (Sprint 1-5)?** Jalankan `backend/database_migrate.sql` untuk menambah tabel `budgets`, `reminders`, `recurring_transactions`, dan kolom `theme_preference`.

**Tabel:** `users` · `user_security` · `wallets` · `categories` · `transactions` · `budgets` · `reminders` · `recurring_transactions`

---

## 🚀 Backend

```bash
cd backend
cp .env.example .env
# Edit .env: isi DB_PASSWORD dan JWT_SECRET
npm install
npm run dev
```

## 🖥️ Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka: `http://localhost:5173`

---

## 🔌 API Endpoints Baru (Sprint 6)

### Budget
| Method | Endpoint | |
|---|---|---|
| GET    | /api/budgets         | List budget per bulan (+ spent, remaining, percent) |
| POST   | /api/budgets         | Buat/update budget kategori |
| DELETE | /api/budgets/:id     | Hapus budget |

### Reminder
| Method | Endpoint | |
|---|---|---|
| GET    | /api/reminders          | List reminder (+ days_left, is_overdue) |
| POST   | /api/reminders          | Buat reminder baru |
| PUT    | /api/reminders/:id      | Edit reminder |
| PUT    | /api/reminders/:id/paid | Tandai lunas (auto-clone jika recurring) |
| DELETE | /api/reminders/:id      | Hapus reminder |

### Recurring Transactions
| Method | Endpoint | |
|---|---|---|
| GET    | /api/recurring             | List jadwal transaksi berulang |
| POST   | /api/recurring             | Buat jadwal baru |
| PUT    | /api/recurring/:id         | Edit jadwal |
| PUT    | /api/recurring/:id/toggle  | Aktif/nonaktifkan |
| DELETE | /api/recurring/:id         | Hapus jadwal |
| POST   | /api/recurring/run-due     | Proses semua transaksi yang sudah jatuh tempo |

### Theme
| Method | Endpoint | |
|---|---|---|
| PUT | /api/users/theme | Simpan preferensi dark/light |

---

## ✅ Fitur Lengkap

### Sprint 1-5 (sebelumnya)
Auth · Multi-wallet · Transaksi (income/expense/transfer+fee) · Kategori kustom · Laporan & chart · Export CSV/PDF · PIN lock · Salary cycle · Month picker · Dompet detail drawer · Hide balance

### Sprint 6 — Fitur Baru
- [x] **Budget Limit per Kategori** — progress bar, alert saat lebih, ringkasan total
- [x] **Reminder Tagihan** — checklist lunas, alert terlambat/akan jatuh tempo, ulangi (mingguan/bulanan/tahunan) dengan auto-clone
- [x] **Dark/Light Mode** — toggle di Profil → Tampilan, tersimpan ke akun + localStorage
- [x] **Recurring Transactions** — jadwal otomatis (harian/mingguan/bulanan/tahunan), tombol "Jalankan Sekarang"
- [x] **Kalender besar dengan PnL harian** — dipindah ke bawah dashboard, klik tanggal untuk detail income/expense/net per hari
- [x] **PIN bisa diketik** — input fisik tersembunyi menangkap keyboard & numpad, tidak harus klik manual
- [x] **Sidebar fix** — klik logo untuk toggle/tutup, tidak ada tombol aneh di pinggir
- [x] **Bottom nav mobile** — 4 menu utama + "Lainnya" yang membuka drawer lengkap

### 🔜 Sprint 7
- [ ] Notifikasi push browser untuk reminder
- [ ] Multi-currency support
- [ ] Backup & restore data (export/import JSON)
