const { validationResult }      = require("express-validator");
const { User, UserSecurity, Wallet } = require("../models");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const { saveOtp, verifyOtp, sendEmailOtp } = require("../utils/otp");
const response = require("../utils/response");
const STATUS   = require("../constants/httpStatus");
const MESSAGE  = require("../constants/messages");

const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
});

// ── REGISTER → kirim OTP email ────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return response.error(res, errors.array()[0].msg, STATUS.BAD_REQUEST);

    const { fullname, username, email, phone, password } = req.body;

    const [emailExist, usernameExist] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { username } }),
    ]);
    if (emailExist)    return response.error(res, MESSAGE.EMAIL_EXISTS,    STATUS.CONFLICT);
    if (usernameExist) return response.error(res, MESSAGE.USERNAME_EXISTS,  STATUS.CONFLICT);

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      fullname, username, email,
      phone: phone || null,
      password: hashedPassword,
      is_verified: false,
    });

    await Promise.all([
      UserSecurity.create({ user_id: user.id }),
      Wallet.create({
        user_id: user.id, name: "Tunai", type: "cash",
        color: "#00e5a0", icon: "wallet", is_default: true,
      }),
    ]);

    // Kirim OTP ke email
    const code = await saveOtp(user.id, "email", "verify");
    await sendEmailOtp(email, fullname, code, "verify");

    return response.success(res,
      "Akun berhasil dibuat! Kode OTP telah dikirim ke email kamu.",
      { user_id: user.id, email },
      STATUS.CREATED
    );
  } catch (err) { next(err); }
};

// ── VERIFY OTP ────────────────────────────────────────────────
const verifyOtpHandler = async (req, res, next) => {
  try {
    const { user_id, code } = req.body;

    if (!user_id || !code)
      return response.error(res, "user_id dan code wajib diisi.", STATUS.BAD_REQUEST);

    const user = await User.findByPk(user_id);
    if (!user) return response.error(res, "User tidak ditemukan.", STATUS.NOT_FOUND);

    if (user.is_verified)
      return response.error(res, "Akun sudah terverifikasi.", STATUS.CONFLICT);

    const valid = await verifyOtp(user_id, code, "email", "verify");
    if (!valid)
      return response.error(res, "Kode OTP tidak valid atau sudah kadaluarsa.", STATUS.BAD_REQUEST);

    await user.update({ is_verified: true });

    return response.success(res, "Akun berhasil diverifikasi! Silakan masuk.", { verified: true });
  } catch (err) { next(err); }
};

// ── RESEND OTP ────────────────────────────────────────────────
const resendOtp = async (req, res, next) => {
  try {
    const { user_id } = req.body;

    const user = await User.findByPk(user_id);
    if (!user)           return response.error(res, "User tidak ditemukan.", STATUS.NOT_FOUND);
    if (user.is_verified) return response.error(res, "Akun sudah terverifikasi.", STATUS.CONFLICT);

    const code = await saveOtp(user.id, "email", "verify");
    await sendEmailOtp(user.email, user.fullname, code, "verify");

    return response.success(res, "Kode OTP baru telah dikirim ke email kamu.");
  } catch (err) { next(err); }
};

// ── LOGIN ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return response.error(res, errors.array()[0].msg, STATUS.BAD_REQUEST);

    const { login: loginInput, password } = req.body;

    const { Op } = require("sequelize");
    const user = await User.findOne({
      where: { [Op.or]: [{ email: loginInput }, { username: loginInput }] },
    });

    if (!user) return response.error(res, MESSAGE.INVALID_CREDENTIAL, STATUS.UNAUTHORIZED);

    const match = await comparePassword(password, user.password);
    if (!match) return response.error(res, MESSAGE.INVALID_CREDENTIAL, STATUS.UNAUTHORIZED);

    if (!user.is_verified) {
      return response.error(res, "Akun belum diverifikasi. Silakan cek email kamu untuk kode OTP.", STATUS.FORBIDDEN, {
        user_id: user.id,
        needs_verification: true,
      });
    }

    const token = generateToken(user);
    res.cookie("token", token, cookieOptions());

    return response.success(res, MESSAGE.LOGIN_SUCCESS, {
      id: user.id, fullname: user.fullname, username: user.username,
      email: user.email, phone: user.phone, avatar: user.avatar || null,
    });
  } catch (err) { next(err); }
};

// ── PROFILE ───────────────────────────────────────────────────
const profile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id","fullname","username","email","phone","avatar","salary_cycle_enabled","salary_day","theme_preference","created_at"],
    });
    if (!user) return response.error(res, MESSAGE.USER_NOT_FOUND, STATUS.NOT_FOUND);
    return response.success(res, MESSAGE.PROFILE_SUCCESS, user);
  } catch (err) { next(err); }
};

// ── LOGOUT ────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });
    return response.success(res, MESSAGE.LOGOUT_SUCCESS);
  } catch (err) { next(err); }
};

module.exports = { register, verifyOtpHandler, resendOtp, login, profile, logout };
