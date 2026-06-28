const db = require("../config/database");

const findAllByUser = async (userId, month, year) => {
  const [rows] = await db.execute(
    `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
            COALESCE((
              SELECT SUM(t.amount + t.fee) FROM transactions t
              WHERE t.user_id = b.user_id AND t.category_id = b.category_id
                AND t.type = 'expense'
                AND MONTH(t.transaction_date) = b.month
                AND YEAR(t.transaction_date)  = b.year
            ), 0) AS spent
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.user_id = ? AND b.month = ? AND b.year = ?
     ORDER BY b.created_at DESC`,
    [userId, month, year]
  );
  return rows;
};

const findById = async (id, userId) => {
  const [rows] = await db.execute("SELECT * FROM budgets WHERE id=? AND user_id=?", [id, userId]);
  return rows[0] || null;
};

const upsert = async ({ userId, categoryId, amount, month, year }) => {
  const [result] = await db.execute(
    `INSERT INTO budgets (user_id, category_id, amount, month, year)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
    [userId, categoryId, amount, month, year]
  );
  return result.insertId || null;
};

const remove = async (id, userId) => {
  const [result] = await db.execute("DELETE FROM budgets WHERE id=? AND user_id=?", [id, userId]);
  return result.affectedRows > 0;
};

module.exports = { findAllByUser, findById, upsert, remove };
