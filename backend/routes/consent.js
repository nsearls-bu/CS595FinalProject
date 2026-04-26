// uses the database to verify if a user has consent or not
const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Get all active consents for a participant
router.get("/active/:participant", async (req, res) => {
  const { participant } = req.params;

  try {
    const result = await db.query(
      `SELECT requester_id, granted_at, revoked_at
       FROM consents
       WHERE participant=$1 AND revoked_at IS NULL AND granted_at IS NOT NULL
       ORDER BY granted_at DESC`,
      [participant],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:participant/:requesterID", async (req, res) => {
  const { participant, requesterID } = req.params;

  const result = await db.query(
    `SELECT *
         FROM consents
         WHERE participant=$1
         AND requester_id=$2`,
    [participant, requesterID],
  );

  res.json(result.rows[0] || null);
});

module.exports = router;
