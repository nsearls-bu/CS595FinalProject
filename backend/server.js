require("dotenv").config();
const express = require("express");
const cors = require("cors");

const requestRoutes = require("./routes/request");
const consentRoutes = require("./routes/consent");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const db = require("./db/db");
const startListener = require("./blockchain/listener");
const contract = require("./blockchain/contract");

const app = express();

app.use(cors());
app.use(express.json());

console.log("Contract address: ", process.env.CONTRACT_ADDRESS);
console.log("RPC URL: ", process.env.RPC_URL);

app.get("/test", async(req, res) => {
  try{
    const nextId = await contract.nextRequestId();
    res.json({nextRequestId: nextId.toString()});
  }catch(err){
    console.error(err);
    res.status(500).json({error: err.message});
  }
})

app.use("/request", requestRoutes);
app.use("/consent", consentRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

startListener(db); // start blockchain event listeners

app.listen(3000, () => {
  console.log("Server running");
});
