// uses the database to verify if a user has consent or not
const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Get all active consents for a participant
router.get("/active/:participant", async (req, res) => {
  const { participant } = req.params;

  try {
    const result = await db.query(
      `SELECT c.request_id, c.requester, a.requester_name, a.data_id, a.purpose, c.granted_at
       FROM consents c
       JOIN access_requests a ON a.request_id = c.request_id
       WHERE c.participant=$1 AND c.revoked_at IS NULL AND c.granted_at IS NOT NULL
       ORDER BY c.granted_at DESC`,
      [participant],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:requestId", async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM consents WHERE request_id=$1`,
      [requestId],
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
