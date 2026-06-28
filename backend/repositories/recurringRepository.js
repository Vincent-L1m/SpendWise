const db = require("../config/database");

const findAllByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT r.*, c.name AS category_name, c.color AS category_color,
            w.name AS wallet_name, tw.name AS to_wallet_name
     FROM recurring_transactions r
     LEFT JOIN categories c  ON r.category_id=c.id
     LEFT JOIN wallets    w  ON r.wallet_id=w.id
     LEFT JOIN wallets    tw ON r.to_wallet_id=tw.id
     WHERE r.user_id=?
     ORDER BY r.is_active DESC, r.next_run_date ASC`,
    [userId]
  );
  return rows;
};

const findById = async (id, userId) => {
  const [rows] = await db.execute("SELECT * FROM recurring_transactions WHERE id=? AND user_id=?", [id, userId]);
  return rows[0] || null;
};

const create = async (data) => {
  const { userId, walletId, toWalletId, categoryId, type, amount, fee, note, frequency, intervalCount, startDate, endDate } = data;
  const [r] = await db.execute(
    `INSERT INTO recurring_transactions
       (user_id,wallet_id,to_wallet_id,category_id,type,amount,fee,note,frequency,interval_count,start_date,end_date,next_run_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [userId, walletId, toWalletId||null, categoryId||null, type, amount, fee||0, note||null, frequency, intervalCount||1, startDate, endDate||null, startDate]
  );
  return r.insertId;
};

const update = async (id, userId, data) => {
  const { walletId, toWalletId, categoryId, type, amount, fee, note, frequency, intervalCount, endDate, isActive } = data;
  const [r] = await db.execute(
    `UPDATE recurring_transactions
     SET wallet_id=?,to_wallet_id=?,category_id=?,type=?,amount=?,fee=?,note=?,frequency=?,interval_count=?,end_date=?,is_active=?
     WHERE id=? AND user_id=?`,
    [walletId, toWalletId||null, categoryId||null, type, amount, fee||0, note||null, frequency, intervalCount||1, endDate||null, isActive===undefined?1:(isActive?1:0), id, userId]
  );
  return r.affectedRows > 0;
};

const toggleActive = async (id, userId, isActive) => {
  const [r] = await db.execute("UPDATE recurring_transactions SET is_active=? WHERE id=? AND user_id=?", [isActive?1:0, id, userId]);
  return r.affectedRows > 0;
};

const remove = async (id, userId) => {
  const [r] = await db.execute("DELETE FROM recurring_transactions WHERE id=? AND user_id=?", [id, userId]);
  return r.affectedRows > 0;
};

// Advance next_run_date based on frequency
const advanceNextRun = (currentDate, frequency, intervalCount = 1) => {
  const d = new Date(currentDate);
  if (frequency === "daily")   d.setDate(d.getDate() + intervalCount);
  if (frequency === "weekly")  d.setDate(d.getDate() + (7 * intervalCount));
  if (frequency === "monthly") d.setMonth(d.getMonth() + intervalCount);
  if (frequency === "yearly")  d.setFullYear(d.getFullYear() + intervalCount);
  return d.toISOString().split("T")[0];
};

const updateNextRun = async (id, nextRunDate) => {
  await db.execute("UPDATE recurring_transactions SET next_run_date=?, last_run_at=NOW() WHERE id=?", [nextRunDate, id]);
};

// Find all due recurring transactions (next_run_date <= today, active)
const findDue = async (userId) => {
  const today = new Date().toISOString().split("T")[0];
  const [rows] = await db.execute(
    `SELECT * FROM recurring_transactions
     WHERE user_id=? AND is_active=1 AND next_run_date<=?
       AND (end_date IS NULL OR end_date>=?)`,
    [userId, today, today]
  );
  return rows;
};

module.exports = { findAllByUser, findById, create, update, toggleActive, remove, advanceNextRun, updateNextRun, findDue };
