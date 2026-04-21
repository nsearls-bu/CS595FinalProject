require("dotenv").config();
const express = require("express");
const cors = require("cors");

const requestRoutes = require("./routes/request");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/request", requestRoutes);

app.listen(3000, () => {
  console.log("Server running");
});
