const db = require("../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const generateToken = () => {
  return "bst_" + crypto.randomBytes(3).toString("hex");
};

const registerUser = async ({ username, password }) => {
  // Check if username already exists
  const { rows: existing } = await db.query(
    `SELECT id FROM "User" WHERE username = $1`,
    [username]
  );

  if (existing.length > 0) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = generateToken();

  const { rows } = await db.query(
    `INSERT INTO "User" (username, password, token, "createdAt")
     VALUES ($1, $2, $3, NOW())
     RETURNING id, username, token`,
    [username, hashedPassword, token]
  );

  return rows[0];
};

const loginUser = async ({ username, password }) => {
  const { rows } = await db.query(
    `SELECT * FROM "User" WHERE username = $1`,
    [username]
  );

  if (rows.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error("Invalid credentials");
  }

  return { id: user.id, username: user.username, token: user.token };
};

module.exports = { registerUser, loginUser };
