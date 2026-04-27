const express = require("express");
const router = express.Router();
const contract = require("../blockchain/contract");
const db = require("../db/db");

// Get all requesters with pending (unapproved) applications
router.get("/requesters", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, address, organization, purpose, approved FROM users WHERE role = 'requester' ORDER BY address`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single requester's status
router.get("/status/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const result = await db.query(
      `SELECT id, organization, purpose, approved FROM users WHERE address=$1`,
      [address]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Requester submits their application
router.post("/apply", async (req, res) => {
  const { address, organization, purpose } = req.body;
  try {
    await db.query(
      `UPDATE users SET organization=$1, purpose=$2 WHERE address=$3`,
      [organization, purpose, address]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Approve a requester on-chain and in the DB
router.post("/approve/:requesterId", async (req, res) => {
  const { requesterId } = req.params;

  try {
    const result = await db.query(
      `SELECT address FROM users WHERE id = $1`,
      [requesterId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Requester not found" });

    const { address } = result.rows[0];
    const tx = await contract.approveRequester(address);
    await tx.wait();

    await db.query(
      `UPDATE users SET approved = TRUE WHERE id = $1`,
      [requesterId]
    );

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Unapprove a requester on-chain and in the DB
router.post("/unapprove/:requesterId", async (req, res) => {
  const { requesterId } = req.params;
  try {
    const result = await db.query(
      `SELECT address FROM users WHERE id = $1`,
      [requesterId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Requester not found" });

    const { address } = result.rows[0];
    const tx = await contract.revokeRequester(address);
    await tx.wait();

    await db.query(
      `UPDATE users SET approved = FALSE WHERE id = $1`,
      [requesterId]
    );

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
