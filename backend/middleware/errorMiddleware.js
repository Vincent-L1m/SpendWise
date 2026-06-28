const response = require("../utils/response");
const STATUS   = require("../constants/httpStatus");

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  // Only log unexpected server errors (not 4xx)
  if (!err.status || err.status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  }

  return response.error(
    res,
    err.message || "Terjadi kesalahan pada server.",
    err.status  || STATUS.INTERNAL_SERVER_ERROR
  );
};

module.exports = errorMiddleware;
