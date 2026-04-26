// listens to the logs to keep track of state of chain rather than having to constantly query chain
const contract = require("./contract");

function startListener(db) {
  // listener for when access is requested by a requester (e.g. institution)
  contract.on("AccessRequested", async (participant, requesterID) => {
    try {
      console.log("AccessRequested");
      await db.query(
        `INSERT INTO access_requests
                 (participant, requester_id)
                 VALUES ($1,$2)`,
        [participant, requesterID],
      );
    } catch (err) {
      console.error("DB error:", err);
    }
  });

  // listener for when consent is granted
  contract.on("ConsentGranted", async (participant, requesterID) => {
    try {
      console.log(
        "ConsentGranted event received for participant:",
        participant,
        "requesterID:",
        requesterID,
      );
      await db.query(
        `INSERT INTO consents (participant, requester_id, granted_at, revoked_at)
         VALUES ($1, $2, NOW(), NULL)
         ON CONFLICT (participant, requester_id) DO UPDATE
         SET granted_at = NOW(), revoked_at = NULL`,
        [participant, requesterID],
      );
      console.log("Consent granted recorded in DB");
    } catch (err) {
      console.error("DB error on ConsentGranted:", err);
    }
  });

  // listener for when consent is revoked
  contract.on("ConsentRevoked", async (participant, requesterID) => {
    try {
      console.log("ConsentRevoked");
      await db.query(
        `UPDATE consents
                 SET revoked_at = NOW()
                 WHERE participant=$1
                 AND requester_id=$2`,
        [participant, requesterID],
      );
    } catch (err) {
      console.error("DB error:", err);
    }
  });
}

module.exports = startListener;
