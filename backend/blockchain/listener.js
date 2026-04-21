const contract = require("./contract");

function startListener(db) {
  contract.on("AccessRequested", (participant, requesterID) => {
    console.log("AccessRequested");

    db.query(
      `INSERT INTO access_requests
                 (participant, requester_id)
                 VALUES ($1,$2)`,
      [participant, requesterID],
    );
  });

  contract.on("ConsentGranted", (participant, requesterID) => {
    console.log("ConsentGranted");

    db.query(
      `UPDATE consents
                 SET granted_at = NOW()
                 WHERE participant=$1
                 AND requester_id=$2`,
      [participant, requesterID],
    );
  });

  contract.on("ConsentRevoked", (participant, requesterID) => {
    console.log("ConsentRevoked");

    db.query(
      `UPDATE consents
                 SET revoked_at = NOW()
                 WHERE participant=$1
                 AND requester_id=$2`,
      [participant, requesterID],
    );
  });
}

module.exports = startListener;
