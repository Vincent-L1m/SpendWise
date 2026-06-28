const db       = require("../config/database");
const response = require("../utils/response");
const STATUS   = require("../constants/httpStatus");

const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT *, ROUND((current_amount/target_amount)*100, 1) AS percent
       FROM savings_goals WHERE user_id=? ORDER BY is_completed ASC, created_at DESC`,
      [req.user.id]
    );
    return response.success(res, "OK", rows);
  } catch(e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { name, target_amount, target_date, icon="🎯", color="#00e5a0" } = req.body;
    if (!name || !target_amount || Number(target_amount) <= 0)
      return response.error(res, "Nama dan target wajib diisi.", STATUS.BAD_REQUEST);
    const [r] = await db.execute(
      "INSERT INTO savings_goals (user_id,name,target_amount,target_date,icon,color) VALUES (?,?,?,?,?,?)",
      [req.user.id, name, Number(target_amount), target_date||null, icon, color]
    );
    return response.success(res, "Target tabungan berhasil dibuat.", { id: r.insertId }, STATUS.CREATED);
  } catch(e) { next(e); }
};

const addFunds = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return response.error(res, "Nominal harus lebih dari 0.", STATUS.BAD_REQUEST);
    const [[goal]] = await db.execute("SELECT * FROM savings_goals WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
    if (!goal) return response.error(res, "Target tidak ditemukan.", STATUS.NOT_FOUND);
    const newAmount = Math.min(Number(goal.current_amount) + Number(amount), Number(goal.target_amount));
    const isCompleted = newAmount >= Number(goal.target_amount) ? 1 : 0;
    await db.execute("UPDATE savings_goals SET current_amount=?, is_completed=? WHERE id=?", [newAmount, isCompleted, goal.id]);
    return response.success(res, isCompleted ? "🎉 Target tabungan tercapai!" : "Dana berhasil ditambahkan.", { current_amount: newAmount, is_completed: isCompleted });
  } catch(e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const [r] = await db.execute("DELETE FROM savings_goals WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
    if (!r.affectedRows) return response.error(res, "Target tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Target tabungan dihapus.");
  } catch(e) { next(e); }
};

module.exports = { getAll, create, addFunds, remove };
