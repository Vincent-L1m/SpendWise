const success = (res, message, data = null, statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const error = (res, message, statusCode = 400, data = null) => {
  const payload = { success: false, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

module.exports = { success, error };
