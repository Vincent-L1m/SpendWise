const db = require("../config/database");

const findAllByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT id,name,type,balance,color,icon,is_default,created_at
     FROM wallets WHERE user_id=? ORDER BY is_default DESC,created_at ASC`,
    [userId]
  );
  return rows;
};

const findById = async (id, userId) => {
  const [rows] = await db.execute(
    "SELECT * FROM wallets WHERE id=? AND user_id=? LIMIT 1",
    [id, userId]
  );
  return rows[0] || null;
};

const create = async ({ userId, name, type, color, icon, isDefault }) => {
  if (isDefault) await db.execute("UPDATE wallets SET is_default=0 WHERE user_id=?", [userId]);
  const [r] = await db.execute(
    "INSERT INTO wallets (user_id,name,type,color,icon,is_default) VALUES (?,?,?,?,?,?)",
    [userId, name, type||"cash", color||"#00d4ff", icon||"wallet", isDefault?1:0]
  );
  return r.insertId;
};

const updateBalance = async (id, amount, conn=db) => {
  await conn.execute("UPDATE wallets SET balance=balance+? WHERE id=?", [amount, id]);
};

// Hard set balance (penyesuaian manual)
const setBalance = async (id, userId, newBalance) => {
  await db.execute(
    "UPDATE wallets SET balance=? WHERE id=? AND user_id=?",
    [newBalance, id, userId]
  );
};

const remove = async (id, userId) => {
  // Only if balance is 0, or force delete — we cascade transactions via FK
  const [r] = await db.execute(
    "DELETE FROM wallets WHERE id=? AND user_id=?",
    [id, userId]
  );
  return r.affectedRows > 0;
};

const getDefaultWallet = async (userId) => {
  const [rows] = await db.execute(
    "SELECT * FROM wallets WHERE user_id=? AND is_default=1 LIMIT 1",
    [userId]
  );
  if (!rows[0]) {
    const [all] = await db.execute(
      "SELECT * FROM wallets WHERE user_id=? ORDER BY created_at ASC LIMIT 1",
      [userId]
    );
    return all[0] || null;
  }
  return rows[0];
};

const getTotalBalance = async (userId) => {
  const [rows] = await db.execute(
    "SELECT COALESCE(SUM(balance),0) AS total FROM wallets WHERE user_id=?",
    [userId]
  );
  return parseFloat(rows[0].total);
};

// Transactions for a specific wallet
const getTransactions = async (walletId, userId, limit=30) => {
  const [rows] = await db.execute(
    `SELECT t.*,
            c.name AS category_name, c.color AS category_color,
            w.name AS wallet_name, tw.name AS to_wallet_name
     FROM transactions t
     LEFT JOIN categories c  ON t.category_id=c.id
     LEFT JOIN wallets    w  ON t.wallet_id=w.id
     LEFT JOIN wallets    tw ON t.to_wallet_id=tw.id
     WHERE t.user_id=?
       AND (t.wallet_id=? OR t.to_wallet_id=?)
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT ?`,
    [userId, walletId, walletId, Number(limit)]
  );
  return rows;
};

module.exports = { findAllByUser, findById, create, updateBalance, setBalance, remove, getDefaultWallet, getTotalBalance, getTransactions };
