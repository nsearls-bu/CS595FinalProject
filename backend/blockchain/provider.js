const { ethers } = require("ethers");

console.log(
  "RPC URL length:",
  process.env.RPC_URL?.length,
  "and private key length:",
  process.env.ADMIN_PRIVATE_KEY?.length,
);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

module.exports = { provider, wallet };
