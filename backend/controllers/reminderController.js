const reminderRepo = require("../repositories/reminderRepository");
const response     = require("../utils/response");
const STATUS       = require("../constants/httpStatus");

const getAll = async (req, res, next) => {
  try {
    const upcoming = req.query.upcoming === "true";
    const reminders = await reminderRepo.findAllByUser(req.user.id, { upcoming });
    const today = new Date().toISOString().split("T")[0];
    const enriched = reminders.map(r => {
      const daysLeft = Math.ceil((new Date(r.due_date) - new Date(today)) / 86400000);
      return { ...r, amount: r.amount ? Number(r.amount) : null, days_left: daysLeft, is_overdue: !r.is_paid && daysLeft < 0 };
    });
    return response.success(res, "OK", enriched);
  } catch(e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { title, amount, due_date, repeat_type, notes } = req.body;
    if (!title?.trim()) return response.error(res, "Judul tagihan wajib diisi.", STATUS.BAD_REQUEST);
    if (!due_date) return response.error(res, "Tanggal jatuh tempo wajib diisi.", STATUS.BAD_REQUEST);
    const id = await reminderRepo.create({ userId: req.user.id, title: title.trim(), amount, dueDate: due_date, repeatType: repeat_type, notes });
    const reminder = await reminderRepo.findById(id, req.user.id);
    return response.success(res, "Reminder berhasil dibuat.", reminder, STATUS.CREATED);
  } catch(e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const { title, amount, due_date, repeat_type, notes } = req.body;
    if (!title?.trim()) return response.error(res, "Judul tagihan wajib diisi.", STATUS.BAD_REQUEST);
    const ok = await reminderRepo.update(req.params.id, req.user.id, { title: title.trim(), amount, dueDate: due_date, repeatType: repeat_type, notes });
    if (!ok) return response.error(res, "Reminder tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Reminder berhasil diperbarui.");
  } catch(e) { next(e); }
};

const markPaid = async (req, res, next) => {
  try {
    const { is_paid } = req.body;
    const reminder = await reminderRepo.findById(req.params.id, req.user.id);
    if (!reminder) return response.error(res, "Reminder tidak ditemukan.", STATUS.NOT_FOUND);
    await reminderRepo.markPaid(req.params.id, req.user.id, is_paid);
    // If marking paid and it's recurring, auto-create next occurrence
    if (is_paid && reminder.repeat_type !== "none") {
      await reminderRepo.cloneNext(reminder);
    }
    return response.success(res, is_paid ? "Ditandai sudah dibayar." : "Ditandai belum dibayar.");
  } catch(e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const ok = await reminderRepo.remove(req.params.id, req.user.id);
    if (!ok) return response.error(res, "Reminder tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Reminder berhasil dihapus.");
  } catch(e) { next(e); }
};

module.exports = { getAll, create, update, markPaid, remove };
