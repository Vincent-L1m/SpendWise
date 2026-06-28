const { validationResult } = require("express-validator");
const userRepo = require("../repositories/userRepository");
const { comparePassword, hashPassword } = require("../utils/password");
const response = require("../utils/response");
const STATUS   = require("../constants/httpStatus");

const getProfile = async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) return response.error(res, "Pengguna tidak ditemukan.", STATUS.NOT_FOUND);
    return response.success(res, "OK", user);
  } catch(e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.error(res, errors.array()[0].msg, STATUS.BAD_REQUEST);
    const { fullname, username, phone } = req.body;
    if (username) {
      const ex = await userRepo.findByUsername(username);
      if (ex && ex.id !== req.user.id) return response.error(res, "Username sudah digunakan.", STATUS.CONFLICT);
    }
    await userRepo.updateProfile(req.user.id, { fullname, username, phone });
    const updated = await userRepo.findById(req.user.id);
    return response.success(res, "Profil berhasil diperbarui.", updated);
  } catch(e) { next(e); }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.error(res, errors.array()[0].msg, STATUS.BAD_REQUEST);
    const { oldPassword, newPassword } = req.body;
    const full = await userRepo.findByLogin((await userRepo.findById(req.user.id)).email);
    const match = await comparePassword(oldPassword, full.password);
    if (!match) return response.error(res, "Password lama tidak sesuai.", STATUS.UNAUTHORIZED);
    await userRepo.updatePassword(req.user.id, await hashPassword(newPassword));
    return response.success(res, "Password berhasil diubah.");
  } catch(e) { next(e); }
};

const updateSalaryCycle = async (req, res, next) => {
  try {
    const { enabled, day } = req.body;
    const salaryDay = Number(day);
    if (enabled && (salaryDay < 1 || salaryDay > 31)) return response.error(res, "Tanggal gajian harus antara 1-31.", STATUS.BAD_REQUEST);
    await userRepo.updateSalaryCycle(req.user.id, { enabled: !!enabled, day: salaryDay || 1 });
    const updated = await userRepo.findById(req.user.id);
    return response.success(res, "Pengaturan siklus gaji berhasil disimpan.", { salary_cycle_enabled: updated.salary_cycle_enabled, salary_day: updated.salary_day });
  } catch(e) { next(e); }
};

// PUT /api/users/theme
const updateTheme = async (req, res, next) => {
  try {
    const { theme } = req.body;
    if (!["dark","light"].includes(theme)) return response.error(res, "Tema tidak valid.", STATUS.BAD_REQUEST);
    await userRepo.updateTheme(req.user.id, theme);
    return response.success(res, "Tema berhasil disimpan.", { theme_preference: theme });
  } catch(e) { next(e); }
};

module.exports = { getProfile, updateProfile, changePassword, updateSalaryCycle, updateTheme };
