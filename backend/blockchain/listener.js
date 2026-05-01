// listens to the logs to keep track of state of chain rather than having to constantly query chain
const contract = require("./contract");

function startListener(db) {
  // listener for when access is requested by a requester (e.g. institution)
  contract.on("AccessRequested", async (requestId, participant, requester, requesterName, dataId, purpose, timestamp) => {
    try {
      console.log("AccessRequested", requestId.toString());
      await db.query(
        `INSERT INTO access_requests (id, participant, requester_address, requester_name, data_id, purpose, status, requested_at)
         VALUES ($1,$2, $3, $4, $5, $6, 'pending', to_timestamp($7))
         ON CONFLICT (id) DO NOTHING`,
        [requestId.toString(), participant, requester, requesterName, dataId, purpose, timestamp.toString()],
      );
    } catch (err) {
      console.error("DB error:", err);
    }
  });

  // listener for when consent is granted
  contract.on("ConsentGranted", async (requestId, participant, timestamp) => {
    try {
      console.log(
        "ConsentGranted", requestId.toString(),
        "for participant:", participant,
      );
      await db.query(
        `UPDATE access_requests
         SET status='granted', granted_at = to_timestamp($1)
         WHERE id=$2`,
         [timestamp.toString(), requestId.toString()]
      );
      console.log("Consent granted recorded in DB");
    } catch (err) {
      console.error("DB error on ConsentGranted:", err);
    }
  });

  // listener for when consent is revoked
  contract.on("ConsentRevoked", async (requestId, participant, timestamp) => {
    try {
      console.log("ConsentRevoked", requestId.toString());
      await db.query(
        `UPDATE access_requests
         SET status='revoked', revoked_at=to_timestamp($1)
         WHERE id=$2`,
         [timestamp.toString(), requestId.toString()],
      );
    } catch (err) {
      console.error("DB error:", err);
    }
  });
}

module.exports = startListener;
