require("dotenv").config();
const express = require("express");
const cors = require("cors");

const requestRoutes = require("./routes/request");
const consentRoutes = require("./routes/consent");

const db = require("./db/db");
const startListener = require("./blockchain/listener");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/request", requestRoutes);
app.use("/consent", consentRoutes);

startListener(db); // start blockchain event listeners

app.listen(3000, () => {
  console.log("Server running");
});
