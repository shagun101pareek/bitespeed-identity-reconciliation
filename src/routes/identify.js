const express = require("express");
const router = express.Router();
const { identify } = require("../controllers/identifyController");

router.post("/identify", identify);

const db = require("../db");

router.get("/contacts", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM "Contact" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;