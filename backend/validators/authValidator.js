const { body } = require("express-validator");

exports.registerValidation = [
  body("fullname")
    .trim()
    .notEmpty().withMessage("Nama lengkap wajib diisi.")
    .isLength({ max: 100 }).withMessage("Nama maksimal 100 karakter."),

  body("username")
    .trim()
    .notEmpty().withMessage("Username wajib diisi.")
    .isLength({ min: 4, max: 50 }).withMessage("Username harus 4–50 karakter.")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username hanya boleh huruf, angka, dan underscore."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email wajib diisi.")
    .isEmail().withMessage("Format email tidak valid.")
    .normalizeEmail(),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s]+$/).withMessage("Format nomor telepon tidak valid.")
    .isLength({ max: 20 }).withMessage("Nomor telepon maksimal 20 karakter."),

  body("password")
    .notEmpty().withMessage("Password wajib diisi.")
    .isLength({ min: 8 }).withMessage("Password minimal 8 karakter."),
];

exports.loginValidation = [
  body("login")
    .trim()
    .notEmpty().withMessage("Email atau username wajib diisi."),

  body("password")
    .notEmpty().withMessage("Password wajib diisi."),
];
