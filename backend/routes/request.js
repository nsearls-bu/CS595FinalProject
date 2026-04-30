const express = require("express");
const router = express.Router();
const contract = require("../blockchain/contract");
const db = require("../db/db");

// Get pending access requests for a participant
router.get("/pending/:participant", async (req, res) => {
  const { participant } = req.params;

  try {
    const result = await db.query(
      `SELECT id, participant, requester_id, requested_at
       FROM access_requests
       WHERE participant=$1 
       AND NOT EXISTS (
         SELECT 1 FROM consents 
         WHERE consents.participant=access_requests.participant 
         AND consents.requester_id=access_requests.requester_id
       )
       ORDER BY requested_at DESC`,
      [participant],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { participant, requesterName, dataId, purpose } = req.body;

    const tx = await contract.requestAccess(participant, requesterName, dataId, purpose);

    await tx.wait();

    res.json({
      success: true,
      txHash: tx.hash,
    });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
