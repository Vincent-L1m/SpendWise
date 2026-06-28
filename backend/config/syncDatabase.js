require("dotenv").config();
const mysql2        = require("mysql2/promise");
const { sequelize } = require("./database");
const { DataTypes } = require("sequelize");

const defineModels = () => {
  sequelize.define("users", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    fullname: { type: DataTypes.STRING(100), allowNull: false },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    avatar: { type: DataTypes.STRING(255), allowNull: true },
    is_verified: { type: DataTypes.TINYINT(1), defaultValue: 0 },
    salary_cycle_enabled: { type: DataTypes.TINYINT(1), defaultValue: 0 },
    salary_day: { type: DataTypes.TINYINT, defaultValue: 1 },
    theme_preference: { type: DataTypes.ENUM("dark","light"), defaultValue: "dark" },
  }, { tableName: "users", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

  sequelize.define("user_security", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    pin: { type: DataTypes.STRING(255), allowNull: true },
    biometric_enabled: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "user_security", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

  sequelize.define("wallets", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM("cash","bank","ewallet","investment","other"), defaultValue: "cash" },
    balance: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    color: { type: DataTypes.STRING(20), defaultValue: "#00d4ff" },
    icon: { type: DataTypes.STRING(50), defaultValue: "wallet" },
    is_default: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "wallets", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

  sequelize.define("categories", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM("income","expense","both"), defaultValue: "both" },
    icon: { type: DataTypes.STRING(50), defaultValue: "tag" },
    color: { type: DataTypes.STRING(20), defaultValue: "#00d4ff" },
    is_custom: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "categories", timestamps: false });

  sequelize.define("transactions", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    wallet_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    to_wallet_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    type: { type: DataTypes.ENUM("income","expense","transfer"), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15,2), allowNull: false },
    fee: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    note: { type: DataTypes.STRING(255), allowNull: true },
    receipt_image: { type: DataTypes.STRING(500), allowNull: true },
    transaction_date: { type: DataTypes.DATEONLY, allowNull: false },
  }, { tableName: "transactions", timestamps: true, createdAt: "created_at", updatedAt: false,
    indexes: [{ fields: ["user_id","transaction_date"] }, { fields: ["wallet_id"] }] });

  sequelize.define("budgets", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15,2), allowNull: false },
    month: { type: DataTypes.TINYINT, allowNull: false },
    year: { type: DataTypes.SMALLINT, allowNull: false },
    notified_80: { type: DataTypes.TINYINT(1), defaultValue: 0 },
    notified_100: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "budgets", timestamps: true, createdAt: "created_at", updatedAt: "updated_at",
    indexes: [{ unique: true, fields: ["user_id","category_id","month","year"] }] });

  sequelize.define("reminders", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15,2), allowNull: true },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    repeat_type: { type: DataTypes.ENUM("none","monthly","weekly","yearly"), defaultValue: "none" },
    is_paid: { type: DataTypes.TINYINT(1), defaultValue: 0 },
    notes: { type: DataTypes.STRING(255), allowNull: true },
  }, { tableName: "reminders", timestamps: true, createdAt: "created_at", updatedAt: "updated_at",
    indexes: [{ fields: ["user_id","due_date"] }] });

  sequelize.define("recurring_transactions", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    wallet_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    to_wallet_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    type: { type: DataTypes.ENUM("income","expense","transfer"), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15,2), allowNull: false },
    fee: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    note: { type: DataTypes.STRING(255), allowNull: true },
    frequency: { type: DataTypes.ENUM("daily","weekly","monthly","yearly"), defaultValue: "monthly" },
    interval_count: { type: DataTypes.INTEGER, defaultValue: 1 },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    next_run_date: { type: DataTypes.DATEONLY, allowNull: false },
    is_active: { type: DataTypes.TINYINT(1), defaultValue: 1 },
    last_run_at: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: "recurring_transactions", timestamps: true, createdAt: "created_at", updatedAt: "updated_at",
    indexes: [{ fields: ["user_id","next_run_date","is_active"] }] });

  sequelize.define("otp_codes", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    code: { type: DataTypes.STRING(6), allowNull: false },
    type: { type: DataTypes.ENUM("email","sms"), allowNull: false },
    purpose: { type: DataTypes.ENUM("verify","reset"), defaultValue: "verify" },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "otp_codes", timestamps: true, createdAt: "created_at", updatedAt: false });

  // ── NEW: savings_goals ─────────────────────────────────────
  sequelize.define("savings_goals", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    target_amount: { type: DataTypes.DECIMAL(15,2), allowNull: false },
    current_amount: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    target_date: { type: DataTypes.DATEONLY, allowNull: true },
    icon: { type: DataTypes.STRING(10), defaultValue: "🎯" },
    color: { type: DataTypes.STRING(20), defaultValue: "#00e5a0" },
    is_completed: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "savings_goals", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

  // ── NEW: split_bills ───────────────────────────────────────
  sequelize.define("split_bills", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15,2), allowNull: false },
    note: { type: DataTypes.STRING(255), allowNull: true },
    is_settled: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "split_bills", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

  sequelize.define("split_bill_members", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    split_bill_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15,2), allowNull: false },
    is_paid: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  }, { tableName: "split_bill_members", timestamps: false });
};

const DEFAULT_CATEGORIES = [
  { name:"Gaji", type:"income", icon:"briefcase", color:"#00e5a0" },
  { name:"Bonus", type:"income", icon:"gift", color:"#00e5a0" },
  { name:"Freelance", type:"income", icon:"code", color:"#00e5a0" },
  { name:"Investasi", type:"income", icon:"trending-up", color:"#00e5a0" },
  { name:"Hadiah", type:"income", icon:"gift", color:"#00d4ff" },
  { name:"Lainnya", type:"income", icon:"plus-circle", color:"#8ba3c7" },
  { name:"Makanan", type:"expense", icon:"coffee", color:"#ff4d6d" },
  { name:"Transportasi", type:"expense", icon:"truck", color:"#f59e0b" },
  { name:"Belanja", type:"expense", icon:"shopping-bag", color:"#7c3aed" },
  { name:"Kesehatan", type:"expense", icon:"heart", color:"#ff4d6d" },
  { name:"Hiburan", type:"expense", icon:"film", color:"#00d4ff" },
  { name:"Pendidikan", type:"expense", icon:"book", color:"#00e5a0" },
  { name:"Tagihan", type:"expense", icon:"file-text", color:"#f59e0b" },
  { name:"Kost/Sewa", type:"expense", icon:"home", color:"#7c3aed" },
  { name:"Bensin", type:"expense", icon:"zap", color:"#f59e0b" },
  { name:"Lainnya", type:"expense", icon:"more-horizontal", color:"#8ba3c7" },
];

const syncDatabase = async () => {
  const dbName = process.env.DB_NAME || "spendwise";
  const host   = process.env.DB_HOST || "localhost";
  const user   = process.env.DB_USER || "root";
  const pass   = process.env.DB_PASSWORD || "";

  const tempConn = await mysql2.createConnection({ host, user, password: pass });
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tempConn.end();
  console.log(`✅ Database "${dbName}" siap`);

  defineModels();
  await sequelize.sync({ alter: true });
  console.log("✅ Semua tabel berhasil disinkronisasi");

  const [rows] = await sequelize.query("SELECT COUNT(*) as cnt FROM categories WHERE is_custom = 0");
  if (rows[0].cnt === 0) {
    const placeholders = DEFAULT_CATEGORIES.map(() => "(?,?,?,?,0)").join(",");
    const values = DEFAULT_CATEGORIES.flatMap(c => [c.name, c.type, c.icon, c.color]);
    await sequelize.query(`INSERT INTO categories (name,type,icon,color,is_custom) VALUES ${placeholders}`, { replacements: values });
    console.log(`✅ ${DEFAULT_CATEGORIES.length} kategori default ditambahkan`);
  } else {
    console.log(`ℹ️  Kategori sudah ada, skip seed`);
  }
};

module.exports = syncDatabase;
