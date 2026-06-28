const db = require("../config/database");

const findAllByUser = async (userId, { upcoming = false } = {}) => {
  let sql = "SELECT * FROM reminders WHERE user_id=?";
  const p = [userId];
  if (upcoming) sql += " AND is_paid=0";
  sql += " ORDER BY due_date ASC";
  const [rows] = await db.execute(sql, p);
  return rows;
};

const findById = async (id, userId) => {
  const [rows] = await db.execute("SELECT * FROM reminders WHERE id=? AND user_id=?", [id, userId]);
  return rows[0] || null;
};

const create = async ({ userId, title, amount, dueDate, repeatType, notes }) => {
  const [r] = await db.execute(
    "INSERT INTO reminders (user_id,title,amount,due_date,repeat_type,notes) VALUES (?,?,?,?,?,?)",
    [userId, title, amount || null, dueDate, repeatType || "none", notes || null]
  );
  return r.insertId;
};

const update = async (id, userId, { title, amount, dueDate, repeatType, notes }) => {
  const [r] = await db.execute(
    "UPDATE reminders SET title=?,amount=?,due_date=?,repeat_type=?,notes=? WHERE id=? AND user_id=?",
    [title, amount || null, dueDate, repeatType || "none", notes || null, id, userId]
  );
  return r.affectedRows > 0;
};

const markPaid = async (id, userId, isPaid) => {
  const [r] = await db.execute("UPDATE reminders SET is_paid=? WHERE id=? AND user_id=?", [isPaid ? 1 : 0, id, userId]);
  return r.affectedRows > 0;
};

const remove = async (id, userId) => {
  const [r] = await db.execute("DELETE FROM reminders WHERE id=? AND user_id=?", [id, userId]);
  return r.affectedRows > 0;
};

// Auto-generate next occurrence when a recurring reminder is marked paid
const cloneNext = async (reminder) => {
  const d = new Date(reminder.due_date);
  if (reminder.repeat_type === "monthly") d.setMonth(d.getMonth() + 1);
  else if (reminder.repeat_type === "weekly") d.setDate(d.getDate() + 7);
  else if (reminder.repeat_type === "yearly") d.setFullYear(d.getFullYear() + 1);
  else return null;

  const nextDate = d.toISOString().split("T")[0];
  const [r] = await db.execute(
    "INSERT INTO reminders (user_id,title,amount,due_date,repeat_type,notes) VALUES (?,?,?,?,?,?)",
    [reminder.user_id, reminder.title, reminder.amount, nextDate, reminder.repeat_type, reminder.notes]
  );
  return r.insertId;
};

module.exports = { findAllByUser, findById, create, update, markPaid, remove, cloneNext };
