const express = require("express");
const router = express.Router();
const db = require("../db/db");
const { ethers } = require("ethers");

// generate a random nonce for the user to sign which will be used for authentication
function generateNonce() {
  return Math.floor(Math.random() * 1e9).toString();
}

// get the nonce for a given address, creating a new user if it doesn't exist and return a message for them to sign for auth
router.get("/nonce/:address", async (req, res) => {
  const { address } = req.params;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  const nonce = generateNonce();

  await db.query(
    `INSERT INTO users (address, nonce)
     VALUES ($1, $2)
     ON CONFLICT (address)
     DO UPDATE SET nonce=$2`,
    [address, nonce]
  );

  res.json({
    message: `Sign this message to authenticate: ${nonce}`
  });
});

// verify that the signature is valid for the given address and nonce
router.post("/verify", async (req, res) => {
  const { address, signature, role } = req.body;

  const result = await db.query(
    `SELECT nonce FROM users WHERE address=$1`,
    [address]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: "User not found" });
  }

  const nonce = result.rows[0].nonce;
  const message = `Sign this message to authenticate: ${nonce}`;

  const recovered = ethers.verifyMessage(message, signature);

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // store role (participant / requester)
  if (role) {
    await db.query(
      `UPDATE users SET role=$1 WHERE address=$2`,
      [role, address]
    );
  }

  // rotate nonce (important for security)
  const newNonce = generateNonce();
  await db.query(
    `UPDATE users SET nonce=$1 WHERE address=$2`,
    [newNonce, address]
  );

  res.json({
    success: true,
    address,
    role
  });
});

module.exports = router;