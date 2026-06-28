const budgetRepo = require("../repositories/budgetRepository");
const response   = require("../utils/response");
const STATUS     = require("../constants/httpStatus");

const getAll = async (req, res, next) => {
  try {
    const now = new Date();
    const month = Number(req.query.month || now.getMonth() + 1);
    const year  = Number(req.query.year  || now.getFullYear());
    const budgets = await budgetRepo.findAllByUser(req.user.id, month, year);
    return response.success(res, "OK", budgets.map(b => ({
      ...b,
      amount:    Number(b.amount),
      spent:     Number(b.spent),
      remaining: Number(b.amount) - Number(b.spent),
      percent:   Number(b.amount) > 0 ? Math.round((Number(b.spent) / Number(b.amount)) * 100) : 0,
    })));
  } catch(e) { next(e); }
};

const upsert = async (req, res, next) => {
  try {
    const { category_id, amount, month, year } = req.body;
    if (!category_id) return response.error(res, "Kategori wajib dipilih.", STATUS.BAD_REQUEST);
    if (!amount || Number(amount) <= 0) return response.error(res, "Nominal budget harus lebih dari 0.", STATUS.BAD_REQUEST);
    const now = new Date();
    await budgetRepo.upsert({
      userId: req.user.id, categoryId: category_id, amount: Number(amount),
      month: month || now.getMonth()+1, year: year || now.getFullYear(),
    });
    return response.success(res, "Budget berhasil disimpan.");
  } catch(e) {
    if (e.code === "ER_DUP_ENTRY") return response.error(res, "Budget untuk kategori ini sudah ada.", STATUS.CONFLICT);
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const ok = await budgetRepo.remove(req.params.id, req.user.id);
    if (!ok) return response.error(res, "Budget tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Budget berhasil dihapus.");
  } catch(e) { next(e); }
};

module.exports = { getAll, upsert, remove };
