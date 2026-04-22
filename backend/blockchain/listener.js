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
      console.log("ConsentGranted");
      await db.query(
        `UPDATE consents
                 SET granted_at = NOW()
                 WHERE participant=$1
                 AND requester_id=$2`,
        [participant, requesterID],
      );
    } catch (err) {
      console.error("DB error:", err);
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
