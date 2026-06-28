const recurringRepo   = require("../repositories/recurringRepository");
const transactionRepo = require("../repositories/transactionRepository");
const walletRepo      = require("../repositories/walletRepository");
const response        = require("../utils/response");
const STATUS          = require("../constants/httpStatus");

const getAll = async (req, res, next) => {
  try {
    const list = await recurringRepo.findAllByUser(req.user.id);
    return response.success(res, "OK", list);
  } catch(e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { wallet_id, to_wallet_id, category_id, type, amount, fee, note, frequency, interval_count, start_date, end_date } = req.body;
    if (!["income","expense","transfer"].includes(type)) return response.error(res, "Tipe tidak valid.", STATUS.BAD_REQUEST);
    if (!amount || Number(amount) <= 0) return response.error(res, "Nominal harus lebih dari 0.", STATUS.BAD_REQUEST);
    if (!wallet_id) return response.error(res, "Dompet wajib dipilih.", STATUS.BAD_REQUEST);
    if (type === "transfer" && !to_wallet_id) return response.error(res, "Dompet tujuan wajib dipilih.", STATUS.BAD_REQUEST);
    if (!["daily","weekly","monthly","yearly"].includes(frequency)) return response.error(res, "Frekuensi tidak valid.", STATUS.BAD_REQUEST);
    if (!start_date) return response.error(res, "Tanggal mulai wajib diisi.", STATUS.BAD_REQUEST);

    const wallet = await walletRepo.findById(wallet_id, req.user.id);
    if (!wallet) return response.error(res, "Dompet tidak ditemukan.", STATUS.NOT_FOUND);

    const id = await recurringRepo.create({
      userId: req.user.id, walletId: wallet_id, toWalletId: to_wallet_id||null,
      categoryId: category_id||null, type, amount: Number(amount), fee: Number(fee||0),
      note, frequency, intervalCount: Number(interval_count||1), startDate: start_date, endDate: end_date||null,
    });
    return response.success(res, "Transaksi berulang berhasil dibuat.", { id }, STATUS.CREATED);
  } catch(e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const { wallet_id, to_wallet_id, category_id, type, amount, fee, note, frequency, interval_count, end_date, is_active } = req.body;
    const ok = await recurringRepo.update(req.params.id, req.user.id, {
      walletId: wallet_id, toWalletId: to_wallet_id||null, categoryId: category_id||null,
      type, amount: Number(amount), fee: Number(fee||0), note, frequency,
      intervalCount: Number(interval_count||1), endDate: end_date||null, isActive: is_active,
    });
    if (!ok) return response.error(res, "Transaksi berulang tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Berhasil diperbarui.");
  } catch(e) { next(e); }
};

const toggleActive = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const ok = await recurringRepo.toggleActive(req.params.id, req.user.id, is_active);
    if (!ok) return response.error(res, "Tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, is_active ? "Diaktifkan." : "Dinonaktifkan.");
  } catch(e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const ok = await recurringRepo.remove(req.params.id, req.user.id);
    if (!ok) return response.error(res, "Tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Berhasil dihapus.");
  } catch(e) { next(e); }
};

// POST /api/recurring/run-due — process all due recurring transactions for this user
const runDue = async (req, res, next) => {
  try {
    const due = await recurringRepo.findDue(req.user.id);
    let created = 0;
    for (const r of due) {
      await transactionRepo.create({
        userId: req.user.id, walletId: r.wallet_id, toWalletId: r.to_wallet_id,
        categoryId: r.category_id, type: r.type, amount: Number(r.amount), fee: Number(r.fee),
        note: r.note ? `${r.note} (otomatis)` : "Transaksi berulang otomatis",
        date: r.next_run_date,
      });
      const nextDate = recurringRepo.advanceNextRun(r.next_run_date, r.frequency, r.interval_count);
      await recurringRepo.updateNextRun(r.id, nextDate);
      created++;
    }
    return response.success(res, `${created} transaksi otomatis berhasil dibuat.`, { created });
  } catch(e) { next(e); }
};

module.exports = { getAll, create, update, toggleActive, remove, runDue };
