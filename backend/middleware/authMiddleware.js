const { verifyToken } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Sesi tidak ditemukan. Silakan login kembali.",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    // Token expired or invalid
    res.clearCookie("token");
    return res.status(401).json({
      success: false,
      message: "Sesi telah berakhir. Silakan login kembali.",
    });
  }
};

module.exports = authMiddleware;
