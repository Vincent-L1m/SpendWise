const { checkBudgetAndNotify } = require("../utils/budgetNotifier");
const transactionRepo = require("../repositories/transactionRepository");
const walletRepo      = require("../repositories/walletRepository");
const userRepo        = require("../repositories/userRepository");
const response        = require("../utils/response");
const STATUS          = require("../constants/httpStatus");

// ── Salary cycle: compute period start/end ────────────────────
const getSalaryCyclePeriod = (salaryDay, referenceDate) => {
  const ref  = referenceDate ? new Date(referenceDate) : new Date();
  const day  = Number(salaryDay) || 1;
  const year = ref.getFullYear();
  const mon  = ref.getMonth(); // 0-based

  // Current cycle start = salary day of current or previous month
  let start = new Date(year, mon, day);
  if (ref < start) start = new Date(year, mon - 1, day);
  let end = new Date(start.getFullYear(), start.getMonth() + 1, day - 1);
  return {
    start: start.toISOString().split("T")[0],
    end:   end.toISOString().split("T")[0],
  };
};

// ── POST /api/transactions ────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { wallet_id, to_wallet_id, category_id, type, amount, fee=0, note, date } = req.body;
    if (!["income","expense","transfer"].includes(type)) return response.error(res, "Tipe tidak valid.", STATUS.BAD_REQUEST);
    if (!amount || Number(amount) <= 0) return response.error(res, "Nominal harus lebih dari 0.", STATUS.BAD_REQUEST);
    if (!wallet_id) return response.error(res, "Dompet wajib dipilih.", STATUS.BAD_REQUEST);
    if (type === "transfer" && !to_wallet_id) return response.error(res, "Dompet tujuan wajib dipilih.", STATUS.BAD_REQUEST);
    if (type === "transfer" && String(wallet_id) === String(to_wallet_id)) return response.error(res, "Dompet asal dan tujuan tidak boleh sama.", STATUS.BAD_REQUEST);

    const wallet = await walletRepo.findById(wallet_id, req.user.id);
    if (!wallet) return response.error(res, "Dompet tidak ditemukan.", STATUS.NOT_FOUND);

    const totalDeduct = Number(amount) + Number(fee || 0);
    if ((type === "expense" || type === "transfer") && Number(wallet.balance) < totalDeduct)
      return response.error(res, "Saldo tidak cukup (termasuk biaya transfer).", STATUS.BAD_REQUEST);

    const id = await transactionRepo.create({
      userId: req.user.id, walletId: wallet_id,
      toWalletId: to_wallet_id||null, categoryId: category_id||null,
      type, amount: Number(amount), fee: Number(fee||0),
      note: note||null, date: date || new Date().toISOString().split("T")[0],
    });
    // Cek budget jika expense
    if (type === "expense") checkBudgetAndNotify(req.user.id).catch(()=>{});
    return response.success(res, "Transaksi berhasil disimpan.", { id }, STATUS.CREATED);
  } catch(e) { next(e); }
};

// ── GET /api/transactions ─────────────────────────────────────
const getAll = async (req, res, next) => {
  try {
    const { type, wallet_id, category_id, start_date, end_date, search, limit, offset } = req.query;
    const list = await transactionRepo.findAll(req.user.id, {
      type, walletId: wallet_id, categoryId: category_id,
      startDate: start_date, endDate: end_date, search,
      limit: limit||50, offset: offset||0,
    });
    return response.success(res, "OK", list);
  } catch(e) { next(e); }
};

// ── GET /api/transactions/summary ────────────────────────────
const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const user = await userRepo.findById(req.user.id);

    let year, month, periodLabel, cycleStart, cycleEnd;

    if (user.salary_cycle_enabled && user.salary_day) {
      const period = getSalaryCyclePeriod(user.salary_day, req.query.ref);
      cycleStart = period.start;
      cycleEnd   = period.end;
      // Use the start date's year/month for summary query
      const sd = new Date(period.start);
      year  = sd.getFullYear();
      month = sd.getMonth() + 1;
      periodLabel = `${period.start} – ${period.end}`;
    } else {
      year  = Number(req.query.year  || now.getFullYear());
      month = Number(req.query.month || now.getMonth() + 1);
    }

    const [monthly, totalBalance, wallets, recent] = await Promise.all([
      transactionRepo.getMonthlySummary(req.user.id, year, month),
      walletRepo.getTotalBalance(req.user.id),
      walletRepo.findAllByUser(req.user.id),
      transactionRepo.getRecent(req.user.id, 5),
    ]);

    return response.success(res, "OK", {
      total_balance:       totalBalance,
      monthly_income:      Number(monthly.total_income),
      monthly_expense:     Number(monthly.total_expense),
      wallets,
      recent_transactions: recent,
      salary_cycle: user.salary_cycle_enabled ? {
        enabled:    true,
        salary_day: user.salary_day,
        period_start: cycleStart,
        period_end:   cycleEnd,
        label:        periodLabel,
      } : { enabled: false },
    });
  } catch(e) { next(e); }
};

// ── GET /api/transactions/chart ───────────────────────────────
const getChart = async (req, res, next) => {
  try {
    const { range = "monthly", weeks = 8, year } = req.query;
    const y = Number(year || new Date().getFullYear());
    let data;
    if (range === "weekly") {
      data = await transactionRepo.getWeeklyData(req.user.id, Number(weeks));
    } else {
      data = await transactionRepo.getYearlyReport(req.user.id, y);
    }
    return response.success(res, "OK", { range, data, year: y });
  } catch(e) { next(e); }
};

// ── GET /api/transactions/report ─────────────────────────────
const getReport = async (req, res, next) => {
  try {
    const now   = new Date();
    const year  = Number(req.query.year  || now.getFullYear());
    const month = req.query.month ? Number(req.query.month) : null;
    const [yearly, byCategory] = await Promise.all([
      transactionRepo.getYearlyReport(req.user.id, year),
      transactionRepo.getExpenseByCategory(req.user.id, year, month),
    ]);
    return response.success(res, "OK", { yearly_data: yearly, expense_by_category: byCategory, year, month });
  } catch(e) { next(e); }
};

// ── GET /api/transactions/export ──────────────────────────────
const getExport = async (req, res, next) => {
  try {
    const rows = await transactionRepo.getForExport(req.user.id, req.query.start_date, req.query.end_date);
    return response.success(res, "OK", rows);
  } catch(e) { next(e); }
};

// ── PUT /api/transactions/:id ─────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { wallet_id, to_wallet_id, category_id, type, amount, fee=0, note, date } = req.body;
    if (!["income","expense","transfer"].includes(type)) return response.error(res, "Tipe tidak valid.", STATUS.BAD_REQUEST);
    if (!amount || Number(amount) <= 0) return response.error(res, "Nominal harus lebih dari 0.", STATUS.BAD_REQUEST);
    const ok = await transactionRepo.update(req.params.id, req.user.id, {
      walletId: wallet_id, toWalletId: to_wallet_id||null,
      categoryId: category_id||null, type,
      amount: Number(amount), fee: Number(fee||0),
      note: note||null, date: date||new Date().toISOString().split("T")[0],
    });
    if (!ok) return response.error(res, "Transaksi tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Transaksi berhasil diperbarui.");
  } catch(e) { next(e); }
};

// ── DELETE /api/transactions/:id ──────────────────────────────
const remove = async (req, res, next) => {
  try {
    const ok = await transactionRepo.remove(req.params.id, req.user.id);
    if (!ok) return response.error(res, "Transaksi tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "Transaksi berhasil dihapus.");
  } catch(e) { next(e); }
};

module.exports = { create, getAll, getSummary, getChart, getReport, getExport, update, remove };
