// listens to the logs to keep track of state of chain rather than having to constantly query chain
const contract = require("./contract");

function startListener(db) {
  // listener for when access is requested by a requester (e.g. institution)
  contract.on("AccessRequested", async (requestId, participant, requester, requesterName, dataId, purpose, timestamp) => {
    try {
      console.log("AccessRequested: ", requestId.toString());
      await db.query(
        `INSERT INTO access_requests
                 (id, participant, requester_address, requester_name, data_id, purpose, requested_at)
                 VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7))`,
        [requestId.toString(), participant, requester, requesterName, dataId, purpose, Number(timestamp)],
      );
    } catch (err) {
      console.error("DB error:", err);
    }
  });

  // listener for when consent is granted
  contract.on("ConsentGranted", async (requestId, participant, timestamp) => {
    try {
      console.log(
        "ConsentGranted:", requestId.toString(),
        "for participant: ", participant,
      );
      await db.query(
        `INSERT INTO consents (request_id, participant, granted_at, revoked_at)
         VALUES ($1, $2, to_timestamp($3), NULL)
         ON CONFLICT (request_id) DO UPDATE
         SET granted_at = to_timestamp($3), revoked_at = NULL`,
        [requestId.toString(), participant, Number(timestamp)],
      );
      console.log("Consent granted recorded in DB");
    } catch (err) {
      console.error("DB error on ConsentGranted:", err);
    }
  });

  // listener for when consent is revoked
  contract.on("ConsentRevoked", async (requestId, participant, timestamp) => {
    try {
      console.log("ConsentRevoked: ", requestId.toString());
      await db.query(
        `UPDATE consents
                 SET revoked_at = to_timestamp($3)
                 WHERE request_id=$1
                 AND participant=$2`,
        [requestId.toString(), participant, Number(timestamp)],
      );
    } catch (err) {
      console.error("DB error:", err);
    }
  });
}

module.exports = startListener;
