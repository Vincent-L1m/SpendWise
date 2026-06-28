const { sequelize, Sequelize } = require("../config/database");
const { DataTypes } = Sequelize;

// ── User Model ────────────────────────────────────────────────
const User = sequelize.define("User", {
  id:                   { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  fullname:             { type: DataTypes.STRING(100),  allowNull: false },
  username:             { type: DataTypes.STRING(50),   allowNull: false, unique: true },
  email:                { type: DataTypes.STRING(150),  allowNull: false, unique: true },
  phone:                { type: DataTypes.STRING(20),   allowNull: true  },
  password:             { type: DataTypes.STRING(255),  allowNull: false },
  avatar:               { type: DataTypes.STRING(255),  allowNull: true  },
  is_verified:          { type: DataTypes.BOOLEAN,      defaultValue: false },
  salary_cycle_enabled: { type: DataTypes.BOOLEAN,      defaultValue: false },
  salary_day:           { type: DataTypes.TINYINT,      defaultValue: 1   },
  theme_preference:     { type: DataTypes.ENUM("dark","light"), defaultValue: "dark" },
}, { tableName: "users", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

// ── OTP Model ─────────────────────────────────────────────────
const OtpCode = sequelize.define("OtpCode", {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  code:       { type: DataTypes.STRING(6),        allowNull: false },
  type:       { type: DataTypes.ENUM("email","sms"), allowNull: false },
  purpose:    { type: DataTypes.ENUM("verify","reset"), defaultValue: "verify" },
  expires_at: { type: DataTypes.DATE,             allowNull: false },
  used:       { type: DataTypes.BOOLEAN,          defaultValue: false },
}, { tableName: "otp_codes", timestamps: true, createdAt: "created_at", updatedAt: false });

// ── UserSecurity Model ────────────────────────────────────────
const UserSecurity = sequelize.define("UserSecurity", {
  id:                { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  pin:               { type: DataTypes.STRING(255), allowNull: true  },
  biometric_enabled: { type: DataTypes.BOOLEAN,     defaultValue: false },
}, { tableName: "user_security", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

// ── Wallet Model ──────────────────────────────────────────────
const Wallet = sequelize.define("Wallet", {
  id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  name:       { type: DataTypes.STRING(100),      allowNull: false },
  type:       { type: DataTypes.ENUM("cash","bank","ewallet","investment","other"), defaultValue: "cash" },
  balance:    { type: DataTypes.DECIMAL(15,2),    defaultValue: 0 },
  color:      { type: DataTypes.STRING(20),       defaultValue: "#00d4ff" },
  icon:       { type: DataTypes.STRING(50),       defaultValue: "wallet" },
  is_default: { type: DataTypes.BOOLEAN,          defaultValue: false },
}, { tableName: "wallets", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

// ── Category Model ────────────────────────────────────────────
const Category = sequelize.define("Category", {
  id:        { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  name:      { type: DataTypes.STRING(100), allowNull: false },
  type:      { type: DataTypes.ENUM("income","expense","both"), defaultValue: "both" },
  icon:      { type: DataTypes.STRING(50),  defaultValue: "tag"     },
  color:     { type: DataTypes.STRING(20),  defaultValue: "#00d4ff" },
  is_custom: { type: DataTypes.BOOLEAN,     defaultValue: false },
}, { tableName: "categories", timestamps: false });

// ── Associations ──────────────────────────────────────────────
User.hasMany(OtpCode,     { foreignKey: "user_id", as: "otps"     });
User.hasOne (UserSecurity,{ foreignKey: "user_id", as: "security" });
User.hasMany(Wallet,      { foreignKey: "user_id", as: "wallets"  });
OtpCode.belongsTo(User,   { foreignKey: "user_id", as: "user"     });

module.exports = { sequelize, User, OtpCode, UserSecurity, Wallet, Category };
