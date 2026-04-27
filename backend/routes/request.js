const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Get pending access requests for a participant
router.get("/pending/:participant", async (req, res) => {
  const { participant } = req.params;

  try {
    const result = await db.query(
      `SELECT id, request_id, requester, requester_name, data_id, purpose, requested_at
       FROM access_requests
       WHERE participant=$1
       AND NOT EXISTS (
         SELECT 1 FROM consents
         WHERE consents.request_id=access_requests.request_id
         AND consents.revoked_at IS NULL
       )
       ORDER BY requested_at DESC`,
      [participant],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all participants
router.get("/participants", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT address FROM users WHERE role = 'participant' ORDER BY address`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete/reject an access request
router.delete("/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const result = await db.query(`DELETE FROM access_requests WHERE id=$1`, [
      requestId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ success: true, message: "Request deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
