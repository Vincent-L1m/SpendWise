const { body } = require("express-validator");

exports.updateProfileValidation = [
  body("fullname")
    .optional()
    .trim()
    .notEmpty().withMessage("Nama lengkap tidak boleh kosong.")
    .isLength({ max: 100 }).withMessage("Nama maksimal 100 karakter."),

  body("username")
    .optional()
    .trim()
    .isLength({ min: 4, max: 50 }).withMessage("Username harus 4–50 karakter.")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username hanya boleh huruf, angka, dan underscore."),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s]+$/).withMessage("Format nomor telepon tidak valid."),
];

exports.changePasswordValidation = [
  body("oldPassword")
    .notEmpty().withMessage("Password lama wajib diisi."),

  body("newPassword")
    .notEmpty().withMessage("Password baru wajib diisi.")
    .isLength({ min: 8 }).withMessage("Password baru minimal 8 karakter."),
];
