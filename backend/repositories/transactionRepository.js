const db = require("../config/database");

// ── Create (atomic) ──────────────────────────────────────────
const create = async ({ userId, walletId, toWalletId, categoryId, type, amount, fee=0, note, date }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `INSERT INTO transactions (user_id,wallet_id,to_wallet_id,category_id,type,amount,fee,note,transaction_date)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [userId, walletId, toWalletId||null, categoryId||null, type, amount, fee||0, note||null, date]
    );
    const id = result.insertId;
    const totalDeduct = Number(amount) + Number(fee || 0);

    if (type === "income")  await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [amount, walletId]);
    if (type === "expense") await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [totalDeduct, walletId]);
    if (type === "transfer" && toWalletId) {
      await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [totalDeduct, walletId]);
      await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [amount,      toWalletId]);
    }
    await conn.commit(); return id;
  } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

// ── Update (atomic) ──────────────────────────────────────────
const update = async (id, userId, { walletId, toWalletId, categoryId, type, amount, fee=0, note, date }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[old]] = await conn.execute("SELECT * FROM transactions WHERE id=? AND user_id=?", [id, userId]);
    if (!old) { await conn.rollback(); return false; }

    const oldDeduct = Number(old.amount) + Number(old.fee || 0);
    const newDeduct = Number(amount)     + Number(fee     || 0);

    // Reverse old
    if (old.type === "income")  await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [old.amount, old.wallet_id]);
    if (old.type === "expense") await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [oldDeduct,  old.wallet_id]);
    if (old.type === "transfer" && old.to_wallet_id) {
      await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [oldDeduct,   old.wallet_id]);
      await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [old.amount,  old.to_wallet_id]);
    }

    // Apply new
    if (type === "income")  await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [amount,    walletId]);
    if (type === "expense") await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [newDeduct, walletId]);
    if (type === "transfer" && toWalletId) {
      await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [newDeduct, walletId]);
      await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [amount,    toWalletId]);
    }

    await conn.execute(
      `UPDATE transactions SET wallet_id=?,to_wallet_id=?,category_id=?,type=?,amount=?,fee=?,note=?,transaction_date=?
       WHERE id=? AND user_id=?`,
      [walletId, toWalletId||null, categoryId||null, type, amount, fee||0, note||null, date, id, userId]
    );
    await conn.commit(); return true;
  } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

// ── Delete (atomic) ──────────────────────────────────────────
const remove = async (id, userId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[t]] = await conn.execute("SELECT * FROM transactions WHERE id=? AND user_id=?", [id, userId]);
    if (!t) { await conn.rollback(); return false; }

    const deduct = Number(t.amount) + Number(t.fee || 0);
    if (t.type === "income")  await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [t.amount, t.wallet_id]);
    if (t.type === "expense") await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [deduct,   t.wallet_id]);
    if (t.type === "transfer" && t.to_wallet_id) {
      await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [deduct,    t.wallet_id]);
      await conn.execute("UPDATE wallets SET balance=balance-? WHERE id=?", [t.amount,  t.to_wallet_id]);
    }
    await conn.execute("DELETE FROM transactions WHERE id=? AND user_id=?", [id, userId]);
    await conn.commit(); return true;
  } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

// ── List ─────────────────────────────────────────────────────
const findAll = async (userId, { type, walletId, categoryId, startDate, endDate, search, limit=50, offset=0 } = {}) => {
  let sql = `SELECT t.*,
             c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
             w.name AS wallet_name,   w.type AS wallet_type,
             tw.name AS to_wallet_name
             FROM transactions t
             LEFT JOIN categories c  ON t.category_id   = c.id
             LEFT JOIN wallets    w  ON t.wallet_id      = w.id
             LEFT JOIN wallets    tw ON t.to_wallet_id   = tw.id
             WHERE t.user_id = ?`;
  const p = [userId];
  if (type)       { sql += " AND t.type=?";                              p.push(type); }
  if (walletId)   { sql += " AND (t.wallet_id=? OR t.to_wallet_id=?)";  p.push(walletId, walletId); }
  if (categoryId) { sql += " AND t.category_id=?";                       p.push(categoryId); }
  if (startDate)  { sql += " AND t.transaction_date>=?";                  p.push(startDate); }
  if (endDate)    { sql += " AND t.transaction_date<=?";                  p.push(endDate); }
  if (search)     { sql += " AND (t.note LIKE ? OR c.name LIKE ?)";       p.push(`%${search}%`, `%${search}%`); }
  sql += " ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ? OFFSET ?";
  p.push(Number(limit), Number(offset));
  const [rows] = await db.execute(sql, p);
  return rows;
};

// ── Monthly summary ───────────────────────────────────────────
const getMonthlySummary = async (userId, year, month) => {
  const [rows] = await db.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount+fee ELSE 0 END), 0) AS total_expense
     FROM transactions
     WHERE user_id=? AND YEAR(transaction_date)=? AND MONTH(transaction_date)=?`,
    [userId, year, month]
  );
  return rows[0];
};

const getRecent = async (userId, limit=5) => {
  const [rows] = await db.execute(
    `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color, w.name AS wallet_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id=c.id
     LEFT JOIN wallets    w ON t.wallet_id=w.id
     WHERE t.user_id=? ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ?`,
    [userId, Number(limit)]
  );
  return rows;
};

// ── Yearly report (bar chart) ─────────────────────────────────
const getYearlyReport = async (userId, year) => {
  const [rows] = await db.execute(
    `SELECT MONTH(transaction_date) AS month,
            COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN type='expense' THEN amount+fee ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE user_id=? AND YEAR(transaction_date)=? AND type != 'transfer'
     GROUP BY MONTH(transaction_date) ORDER BY month ASC`,
    [userId, year]
  );
  return rows;
};

// ── Weekly data (last N weeks) ────────────────────────────────
const getWeeklyData = async (userId, weeks=8) => {
  const [rows] = await db.execute(
    `SELECT
       YEARWEEK(transaction_date, 1) AS yw,
       MIN(transaction_date) AS week_start,
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount+fee ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE user_id=? AND type != 'transfer'
       AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
     GROUP BY YEARWEEK(transaction_date,1) ORDER BY yw ASC`,
    [userId, weeks]
  );
  return rows;
};

// ── Expense by category ───────────────────────────────────────
const getExpenseByCategory = async (userId, year, month) => {
  let sql = `SELECT c.name, c.color, c.icon,
                    COALESCE(SUM(t.amount+t.fee), 0) AS total
             FROM transactions t
             LEFT JOIN categories c ON t.category_id=c.id
             WHERE t.user_id=? AND t.type='expense'`;
  const p = [userId];
  if (year)  { sql += " AND YEAR(t.transaction_date)=?";  p.push(year); }
  if (month) { sql += " AND MONTH(t.transaction_date)=?"; p.push(month); }
  sql += " GROUP BY t.category_id, c.name, c.color, c.icon ORDER BY total DESC LIMIT 10";
  const [rows] = await db.execute(sql, p);
  return rows;
};

// ── Export ────────────────────────────────────────────────────
const getForExport = async (userId, startDate, endDate) => {
  let sql = `SELECT t.transaction_date, t.type, t.amount, t.fee, t.note,
                    c.name AS category, w.name AS wallet, tw.name AS to_wallet
             FROM transactions t
             LEFT JOIN categories c  ON t.category_id=c.id
             LEFT JOIN wallets    w  ON t.wallet_id=w.id
             LEFT JOIN wallets    tw ON t.to_wallet_id=tw.id
             WHERE t.user_id=?`;
  const p = [userId];
  if (startDate) { sql += " AND t.transaction_date>=?"; p.push(startDate); }
  if (endDate)   { sql += " AND t.transaction_date<=?"; p.push(endDate); }
  sql += " ORDER BY t.transaction_date DESC, t.created_at DESC";
  const [rows] = await db.execute(sql, p);
  return rows;
};

module.exports = { create, update, remove, findAll, getMonthlySummary, getRecent, getYearlyReport, getWeeklyData, getExpenseByCategory, getForExport };
