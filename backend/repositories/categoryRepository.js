const db = require("../config/database");

const findAllByUser = async (userId, type=null) => {
  let sql=`SELECT id,name,type,icon,color,is_custom,user_id FROM categories
           WHERE (user_id IS NULL OR user_id=?)`;
  const p=[userId];
  if(type&&type!=="both"){ sql+=` AND (type=? OR type='both')`; p.push(type); }
  sql+=` ORDER BY is_custom ASC,name ASC`;
  const [rows]=await db.execute(sql,p); return rows;
};

const findById = async (id) => {
  const [rows]=await db.execute("SELECT * FROM categories WHERE id=? LIMIT 1",[id]);
  return rows[0]||null;
};

const create = async ({userId, name, type, icon, color}) => {
  const [result] = await db.execute(
    `INSERT INTO categories (user_id,name,type,icon,color,is_custom) VALUES (?,?,?,?,?,1)`,
    [userId, name, type||"both", icon||"tag", color||"#00d4ff"]
  );
  return result.insertId;
};

const update = async (id, userId, {name, type, icon, color}) => {
  const [result] = await db.execute(
    `UPDATE categories SET name=?,type=?,icon=?,color=? WHERE id=? AND user_id=? AND is_custom=1`,
    [name, type||"both", icon||"tag", color||"#00d4ff", id, userId]
  );
  return result.affectedRows > 0;
};

const remove = async (id, userId) => {
  const [result] = await db.execute(
    "DELETE FROM categories WHERE id=? AND user_id=? AND is_custom=1",
    [id, userId]
  );
  return result.affectedRows > 0;
};

module.exports = { findAllByUser, findById, create, update, remove };
