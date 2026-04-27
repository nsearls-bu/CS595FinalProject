// listens to the logs to keep track of state of chain rather than having to constantly query chain
const contract = require("./contract");

function startListener(db) {
  // listener for when access is requested by a requester
  contract.on("AccessRequested", async (requestId, participant, requester, requesterName, dataId, purpose, timestamp) => {
    try {
      console.log("AccessRequested", { requestId: requestId.toString(), participant, requester });
      await db.query(
        `INSERT INTO access_requests (request_id, participant, requester, requester_name, data_id, purpose)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (request_id) DO NOTHING`,
        [requestId.toString(), participant, requester, requesterName, dataId, purpose]
      );
    } catch (err) {
      console.error("DB error on AccessRequested:", err);
    }
  });

  // listener for when consent is granted
  contract.on("ConsentGranted", async (requestId, participant, timestamp) => {
    try {
      console.log("ConsentGranted", { requestId: requestId.toString(), participant });
      await db.query(
        `INSERT INTO consents (request_id, participant, requester, granted_at)
         SELECT $1, participant, requester, NOW()
         FROM access_requests WHERE request_id = $1
         ON CONFLICT (request_id) DO UPDATE SET granted_at = NOW(), revoked_at = NULL`,
        [requestId.toString()]
      );
    } catch (err) {
      console.error("DB error on ConsentGranted:", err);
    }
  });

  // listener for when consent is revoked
  contract.on("ConsentRevoked", async (requestId, participant, timestamp) => {
    try {
      console.log("ConsentRevoked", { requestId: requestId.toString(), participant });
      await db.query(
        `UPDATE consents SET revoked_at = NOW() WHERE request_id = $1`,
        [requestId.toString()]
      );
    } catch (err) {
      console.error("DB error on ConsentRevoked:", err);
    }
  });
}

module.exports = startListener;
