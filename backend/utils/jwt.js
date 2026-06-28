const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }   // 7 days — user stays logged in
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
