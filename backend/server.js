require("dotenv").config();
const express = require("express");
const cors = require("cors");

const requestRoutes = require("./routes/request");
const consentRoutes = require("./routes/consent");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/request", requestRoutes);
app.use("/consent", consentRoutes);

app.listen(3000, () => {
  console.log("Server running");
});
