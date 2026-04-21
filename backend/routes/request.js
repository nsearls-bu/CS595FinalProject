const express = require("express");
const router = express.Router();
const contract = require("../blockchain/contract");

router.post("/", async (req, res) => {
    try {

        const { participant, requesterID } = req.body;

        const tx = await contract.requestAccess(
            participant,
            requesterID
        );

        await tx.wait();

        res.json({
            success: true,
            txHash: tx.hash
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;