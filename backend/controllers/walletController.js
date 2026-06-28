const walletRepo = require("../repositories/walletRepository");
const response   = require("../utils/response");
const STATUS     = require("../constants/httpStatus");

const getAll = async (req, res, next) => {
  try {
    const wallets = await walletRepo.findAllByUser(req.user.id);
    const total   = await walletRepo.getTotalBalance(req.user.id);
    return response.success(res, "OK", { wallets, total_balance: total });
  } catch(e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { name, type, color, icon, is_default } = req.body;
    if (!name?.trim()) return response.error(res, "Nama dompet wajib diisi.", STATUS.BAD_REQUEST);
    const id = await walletRepo.create({ userId:req.user.id, name:name.trim(), type, color, icon, isDefault:is_default?1:0 });
    const wallet = await walletRepo.findById(id, req.user.id);
    return response.success(res, "Dompet berhasil dibuat.", wallet, STATUS.CREATED);
  } catch(e) { next(e); }
};

// DELETE /api/wallets/:id
const remove = async (req, res, next) => {
  try {
    const wallet = await walletRepo.findById(req.params.id, req.user.id);
    if (!wallet) return response.error(res, "Dompet tidak ditemukan.", STATUS.NOT_FOUND);
    if (wallet.is_default) return response.error(res, "Tidak bisa menghapus dompet utama. Ubah dulu dompet default ke dompet lain.", STATUS.BAD_REQUEST);
    const ok = await walletRepo.remove(req.params.id, req.user.id);
    if (!ok) return response.error(res, "Gagal menghapus dompet.", STATUS.BAD_REQUEST);
    return response.success(res, "Dompet berhasil dihapus.");
  } catch(e) { next(e); }
};

// PUT /api/wallets/:id/adjust — manual balance adjustment
const adjustBalance = async (req, res, next) => {
  try {
    const { balance, note } = req.body;
    if (balance === undefined || isNaN(Number(balance)))
      return response.error(res, "Saldo tidak valid.", STATUS.BAD_REQUEST);
    if (Number(balance) < 0)
      return response.error(res, "Saldo tidak boleh negatif.", STATUS.BAD_REQUEST);
    const wallet = await walletRepo.findById(req.params.id, req.user.id);
    if (!wallet) return response.error(res, "Dompet tidak ditemukan.", STATUS.NOT_FOUND);
    await walletRepo.setBalance(req.params.id, req.user.id, Number(balance));
    const updated = await walletRepo.findById(req.params.id, req.user.id);
    return response.success(res, "Saldo berhasil disesuaikan.", updated);
  } catch(e) { next(e); }
};

// GET /api/wallets/:id/transactions
const getTransactions = async (req, res, next) => {
  try {
    const wallet = await walletRepo.findById(req.params.id, req.user.id);
    if (!wallet) return response.error(res, "Dompet tidak ditemukan.", STATUS.NOT_FOUND);
    const txs = await walletRepo.getTransactions(req.params.id, req.user.id, req.query.limit || 30);
    return response.success(res, "OK", { wallet, transactions: txs });
  } catch(e) { next(e); }
};

module.exports = { getAll, create, remove, adjustBalance, getTransactions };
