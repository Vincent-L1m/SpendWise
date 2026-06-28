require("dotenv").config();
const { Sequelize } = require("sequelize");
const mysql2        = require("mysql2");

// ── Sequelize instance (pakai database spendwise) ─────────────
const sequelize = new Sequelize(
  process.env.DB_NAME     || "spendwise",
  process.env.DB_USER     || "root",
  process.env.DB_PASSWORD || "",
  {
    host:    process.env.DB_HOST || "localhost",
    dialect: "mysql",
    timezone: "+07:00",
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    logging: false,
  }
);

// ── Raw mysql2 pool (untuk repositories yang pakai raw query) ──
const pool = mysql2.createPool({
  host:               process.env.DB_HOST     || "localhost",
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "spendwise",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "+07:00",
});

const db                = pool.promise();
db.sequelize            = sequelize;
db.Sequelize            = Sequelize;

module.exports = db;
