const response = require("../utils/response");
const STATUS   = require("../constants/httpStatus");

const notFoundMiddleware = (req, res) => {
  return response.error(
    res,
    `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan.`,
    STATUS.NOT_FOUND
  );
};

module.exports = notFoundMiddleware;
