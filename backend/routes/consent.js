router.get("/:participant/:requesterID", async (req,res) => {

    const { participant, requesterID } = req.params;

    const result = await db.query(
        `SELECT *
         FROM consents
         WHERE participant=$1
         AND requester_id=$2`,
         [participant, requesterID]
    );

    res.json(result.rows[0]);
});