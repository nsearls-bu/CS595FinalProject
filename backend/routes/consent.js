// uses the database to verify if a user has consent or not
const express = require("express");
const router = express.Router();
const db = require("../db/db");

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
