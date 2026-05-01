// uses the database to verify if a user has consent or not
const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Get all active consents for a participant
router.get("/active/:participant", async (req, res) => {
  const { participant } = req.params;

  try {
    const result = await db.query(
      `SELECT id, requester_address, requester_name, data_id, purpose, granted_at
       FROM access_requests
       WHERE participant=$1 AND status='granted'
       ORDER BY granted_at DESC`,
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
