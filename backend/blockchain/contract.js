const { ethers } = require("ethers");
const { wallet, provider } = require("./provider");
const abi = require("../abi/DynamicConsent.json");

const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(contractAddress, abi, wallet);

module.exports = contract;
