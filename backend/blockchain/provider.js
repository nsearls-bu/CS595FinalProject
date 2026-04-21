// Creates the connection to Ethereum and the signing wallet
const { ethers } = require("ethers");

// ensuring that it is reading dotenv properly and that it is properly formatted
console.log(
  "RPC URL length:",
  process.env.RPC_URL?.length,
  "and private key length:",
  process.env.ADMIN_PRIVATE_KEY?.length,
);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

module.exports = { provider, wallet };
