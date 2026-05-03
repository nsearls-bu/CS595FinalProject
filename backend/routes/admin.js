const express = require("express");
const router = express.Router();
const contract = require("../blockchain/contract");
const db = require("../db/db");

// Get all requesters with pending (unapproved) applications
router.get("/requesters", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.id, a.requester_address, a.organization, a.purpose, a.approved
       FROM applications a
       ORDER BY a.created_at DESC`
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
      `SELECT id, organization, purpose, approved
       FROM applications
       WHERE requester_address=$1
       ORDER BY created_at DESC`,
      [address]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows);
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
      `INSERT INTO applications (requester_address, organization, purpose)
       VALUES ($1, $2, $3)`,
      [address, organization, purpose]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Approve a requester on-chain and in the DB
router.post("/approve/:id", async(req, res)=> {
  const { id } = req.params;

  try{
    const result = await db.query(
      `SELECT requester_address FROM applications WHERE id=$1`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Application not found"});

    const {requester_address} = result.rows[0];

    const isApproved = await contract.approvedRequesters(requester_address);
    if(!isApproved){
      const tx = await contract.approveRequester(requester_address);
      await tx.wait();
    }

    await db.query(`UPDATE applications SET approved = TRUE WHERE id = $1`, [id]);
    res.json({success:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

// Unapprove a requester on-chain and in the DB
router.post("/unapprove/:id", async(req, res) =>{
  const { id } = req.params;
  try{
    const result = await db.query(
      `SELECT requester_address FROM applications WHERE id=$1`,
      [id]
    );
    if(result.rows.length === 0)
      return res.status(404).json({error: "Application not found"});

    const {requester_address} = result.rows[0];

    await db.query(
      `UPDATE applications SET approved = FALSE WHERE id = $1`,
      [id]
    );

    const remaining = await db.query(
      `SELECT id FROM applications WHERE requester_address=$1 AND approved=TRUE`,
      [requester_address]
    );
    if(remaining.rows.length === 0){
      const tx = await contract.revokeRequester(requester_address);
      await tx.wait();
    }

    res.json({success: true});
  }catch (err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

module.exports = router;
