const securityRepository         = require("../repositories/securityRepository");
const { hashPassword, comparePassword } = require("../utils/password");
const response = require("../utils/response");
const STATUS   = require("../constants/httpStatus");

// ── POST /api/security/create-pin ───────────────────────────
const createPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{6}$/.test(pin)) {
      return response.error(res, "PIN harus tepat 6 digit angka.", STATUS.BAD_REQUEST);
    }

    // Ensure security record exists
    const existing = await securityRepository.findByUserId(req.user.id);
    if (!existing) await securityRepository.create(req.user.id);

    if (existing?.pin) {
      return response.error(res, "PIN sudah dibuat. Gunakan endpoint ganti PIN.", STATUS.CONFLICT);
    }

    const hashedPin = await hashPassword(pin);
    await securityRepository.updatePin(req.user.id, hashedPin);

    return response.success(res, "PIN berhasil dibuat.");
  } catch (err) {
    next(err);
  }
};

// ── POST /api/security/verify-pin ───────────────────────────
const verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return response.error(res, "PIN wajib diisi.", STATUS.BAD_REQUEST);
    }

    const security = await securityRepository.findByUserId(req.user.id);
    if (!security?.pin) {
      return response.error(res, "PIN belum dibuat.", STATUS.NOT_FOUND);
    }

    const match = await comparePassword(pin, security.pin);
    if (!match) {
      return response.error(res, "PIN salah.", STATUS.UNAUTHORIZED);
    }

    return response.success(res, "PIN valid.");
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/security/change-pin ────────────────────────────
const changePin = async (req, res, next) => {
  try {
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
      return response.error(res, "PIN lama dan PIN baru wajib diisi.", STATUS.BAD_REQUEST);
    }
    if (!/^\d{6}$/.test(newPin)) {
      return response.error(res, "PIN baru harus tepat 6 digit angka.", STATUS.BAD_REQUEST);
    }

    const security = await securityRepository.findByUserId(req.user.id);
    if (!security?.pin) {
      return response.error(res, "PIN belum dibuat.", STATUS.NOT_FOUND);
    }

    const match = await comparePassword(oldPin, security.pin);
    if (!match) {
      return response.error(res, "PIN lama salah.", STATUS.UNAUTHORIZED);
    }

    if (oldPin === newPin) {
      return response.error(res, "PIN baru tidak boleh sama dengan PIN lama.", STATUS.BAD_REQUEST);
    }

    const hashedPin = await hashPassword(newPin);
    await securityRepository.updatePin(req.user.id, hashedPin);

    return response.success(res, "PIN berhasil diubah.");
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/security/remove-pin ────────────────────────────
const removePin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    const security = await securityRepository.findByUserId(req.user.id);
    if (!security?.pin) {
      return response.error(res, "PIN belum dibuat.", STATUS.NOT_FOUND);
    }

    const match = await comparePassword(pin, security.pin);
    if (!match) {
      return response.error(res, "PIN salah.", STATUS.UNAUTHORIZED);
    }

    await securityRepository.removePin(req.user.id);
    return response.success(res, "PIN berhasil dihapus.");
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/security/enable-biometric ──────────────────────
const enableBiometric = async (req, res, next) => {
  try {
    const security = await securityRepository.findByUserId(req.user.id);
    if (!security) await securityRepository.create(req.user.id);

    await securityRepository.enableBiometric(req.user.id);
    return response.success(res, "Biometrik berhasil diaktifkan.");
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/security/disable-biometric ─────────────────────
const disableBiometric = async (req, res, next) => {
  try {
    await securityRepository.disableBiometric(req.user.id);
    return response.success(res, "Biometrik berhasil dinonaktifkan.");
  } catch (err) {
    next(err);
  }
};

// ── GET /api/security/status ─────────────────────────────────
const getStatus = async (req, res, next) => {
  try {
    const security = await securityRepository.findByUserId(req.user.id);
    return response.success(res, "Status keamanan berhasil diambil.", {
      has_pin:           !!security?.pin,
      biometric_enabled: !!security?.biometric_enabled,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPin,
  verifyPin,
  changePin,
  removePin,
  enableBiometric,
  disableBiometric,
  getStatus,
};
