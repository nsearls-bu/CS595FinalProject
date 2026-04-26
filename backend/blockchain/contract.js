// Creates a contract object that represents our deployed smart contract
const { ethers } = require("ethers");
const { wallet, provider } = require("./provider");
const abi = require("../abi/DynamicConsent.json");

const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(contractAddress, abi, wallet);

module.exports = contract;
// We can now use contract for operation like contract.requestAccess(...) and contract.hasConsent(...)
