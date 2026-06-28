const db = require("../config/database");

const findByEmail    = async (email)    => { const [r] = await db.execute("SELECT * FROM users WHERE email=? LIMIT 1",    [email]);    return r[0]||null; };
const findByUsername = async (username) => { const [r] = await db.execute("SELECT * FROM users WHERE username=? LIMIT 1", [username]); return r[0]||null; };
const findByLogin    = async (login)    => { const [r] = await db.execute("SELECT * FROM users WHERE email=? OR username=? LIMIT 1", [login, login]); return r[0]||null; };

const findById = async (id) => {
  const [r] = await db.execute(
    `SELECT id,fullname,username,email,phone,avatar,salary_cycle_enabled,salary_day,theme_preference,created_at
     FROM users WHERE id=? LIMIT 1`,
    [id]
  );
  return r[0]||null;
};

const create = async ({ fullname, username, email, phone, password }) => {
  const [result] = await db.execute(
    "INSERT INTO users (fullname,username,email,phone,password) VALUES (?,?,?,?,?)",
    [fullname, username, email, phone||null, password]
  );
  return result.insertId;
};

const updateProfile = async (id, { fullname, username, phone }) => {
  const fields = [], values = [];
  if (fullname !== undefined) { fields.push("fullname=?"); values.push(fullname); }
  if (username !== undefined) { fields.push("username=?"); values.push(username); }
  if (phone    !== undefined) { fields.push("phone=?");    values.push(phone);    }
  if (!fields.length) return false;
  values.push(id);
  await db.execute(`UPDATE users SET ${fields.join(",")} WHERE id=?`, values);
  return true;
};

const updatePassword = async (id, hashedPassword) => {
  await db.execute("UPDATE users SET password=? WHERE id=?", [hashedPassword, id]);
};

const updateSalaryCycle = async (id, { enabled, day }) => {
  await db.execute("UPDATE users SET salary_cycle_enabled=?, salary_day=? WHERE id=?", [enabled?1:0, Number(day)||1, id]);
};

const updateTheme = async (id, theme) => {
  await db.execute("UPDATE users SET theme_preference=? WHERE id=?", [theme === "light" ? "light" : "dark", id]);
};

module.exports = { findByEmail, findByUsername, findByLogin, findById, create, updateProfile, updatePassword, updateSalaryCycle, updateTheme };
