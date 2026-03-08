const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
});

pool.on("connect", () => {
  console.log("Connected to the TEST database");
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};