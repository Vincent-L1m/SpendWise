const db       = require("../config/database");
const response = require("../utils/response");
const STATUS   = require("../constants/httpStatus");

const getAll = async (req, res, next) => {
  try {
    const [bills] = await db.execute(
      "SELECT * FROM split_bills WHERE user_id=? ORDER BY created_at DESC", [req.user.id]
    );
    for (const bill of bills) {
      const [members] = await db.execute("SELECT * FROM split_bill_members WHERE split_bill_id=?", [bill.id]);
      bill.members = members;
    }
    return response.success(res, "OK", bills);
  } catch(e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { title, total_amount, note, members=[] } = req.body;
    if (!title || !total_amount || members.length < 2)
      return response.error(res, "Judul, total, dan minimal 2 anggota wajib diisi.", STATUS.BAD_REQUEST);
    const [r] = await db.execute(
      "INSERT INTO split_bills (user_id,title,total_amount,note) VALUES (?,?,?,?)",
      [req.user.id, title, Number(total_amount), note||null]
    );
    const billId = r.insertId;
    for (const m of members) {
      await db.execute("INSERT INTO split_bill_members (split_bill_id,name,amount) VALUES (?,?,?)",
        [billId, m.name, Number(m.amount)]);
    }
    return response.success(res, "Split bill berhasil dibuat.", { id: billId }, STATUS.CREATED);
  } catch(e) { next(e); }
};

const togglePaid = async (req, res, next) => {
  try {
    const [[member]] = await db.execute(
      "SELECT sbm.* FROM split_bill_members sbm JOIN split_bills sb ON sb.id=sbm.split_bill_id WHERE sbm.id=? AND sb.user_id=?",
      [req.params.memberId, req.user.id]
    );
    if (!member) return response.error(res, "Anggota tidak ditemukan.", STATUS.NOT_FOUND);
    await db.execute("UPDATE split_bill_members SET is_paid=? WHERE id=?", [member.is_paid ? 0 : 1, member.id]);
    // Check if all paid
    const [[{unpaid}]] = await db.execute("SELECT COUNT(*) as unpaid FROM split_bill_members WHERE split_bill_id=? AND is_paid=0", [member.split_bill_id]);
    if (unpaid === 0) await db.execute("UPDATE split_bills SET is_settled=1 WHERE id=?", [member.split_bill_id]);
    return response.success(res, "Status pembayaran diperbarui.");
  } catch(e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const [r] = await db.execute("DELETE FROM split_bills WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
    if (!r.affectedRows) return response.error(res, "Split bill tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Split bill dihapus.");
  } catch(e) { next(e); }
};

module.exports = { getAll, create, togglePaid, remove };
