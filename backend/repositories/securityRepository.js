const db = require("../config/database");

const findByUserId = async (userId) => {
  const [rows] = await db.execute(
    "SELECT * FROM user_security WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows[0] || null;
};

const create = async (userId) => {
  await db.execute(
    "INSERT IGNORE INTO user_security (user_id) VALUES (?)",
    [userId]
  );
};

const updatePin = async (userId, hashedPin) => {
  await db.execute(
    "UPDATE user_security SET pin = ? WHERE user_id = ?",
    [hashedPin, userId]
  );
};

const removePin = async (userId) => {
  await db.execute(
    "UPDATE user_security SET pin = NULL WHERE user_id = ?",
    [userId]
  );
};

const enableBiometric = async (userId) => {
  await db.execute(
    "UPDATE user_security SET biometric_enabled = 1 WHERE user_id = ?",
    [userId]
  );
};

const disableBiometric = async (userId) => {
  await db.execute(
    "UPDATE user_security SET biometric_enabled = 0 WHERE user_id = ?",
    [userId]
  );
};

module.exports = {
  findByUserId,
  create,
  updatePin,
  removePin,
  enableBiometric,
  disableBiometric,
};
