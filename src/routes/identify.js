const express = require("express");
const router = express.Router();
const { identify } = require("../controllers/identifyController");
const db = require("../db");


/**
 * @swagger
 * /identify:
 *   post:
 *     summary: Identify and reconcile a contact
 *     description: Links customer identities across multiple purchases based on email or phone number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: lorraine@hillvalley.edu
 *               phoneNumber:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Consolidated contact
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contact:
 *                   type: object
 *                   properties:
 *                     primaryContatctId:
 *                       type: integer
 *                       example: 1
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"]
 *                     phoneNumbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["123456"]
 *                     secondaryContactIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [23]
 *       400:
 *         description: Bad request
 */
router.post("/identify", identify);


/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts
 *     description: Returns all contacts in the database
 *     responses:
 *       200:
 *         description: List of all contacts
 */
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