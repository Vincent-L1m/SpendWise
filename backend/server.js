require("dotenv").config();

const app         = require("./app");
const syncDatabase = require("./config/syncDatabase");

const PORT = process.env.PORT || 5000;

// ── Boot sequence ──────────────────────────────────────────────
(async () => {
  try {
    console.log("🔄 Menginisialisasi database...");

    // Buat database + tabel + seed otomatis
    await syncDatabase();

    // Nyalakan server setelah DB siap
    app.listen(PORT, () => {
      console.log("─────────────────────────────────────────");
      console.log(`🚀 SpendWise API running → http://localhost:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
      console.log("─────────────────────────────────────────");
    });
  } catch (err) {
    console.error("❌ Gagal menginisialisasi database:");
    console.error("  ", err.message);
    console.error("\n💡 Pastikan:");
    console.error("   • MySQL / XAMPP sudah berjalan");
    console.error("   • File .env sudah diisi (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)");
    process.exit(1);
  }
})();
