require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const rawPrivateKey = process.env.PRIVATE_KEY || "";
const normalizedPrivateKey = rawPrivateKey
  ? rawPrivateKey.startsWith("0x")
    ? rawPrivateKey
    : `0x${rawPrivateKey}`
  : "";
const sharedAccounts = normalizedPrivateKey ? [normalizedPrivateKey] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    shardeumTestnet: {
      url: process.env.SHARDEUM_RPC_URL || "https://api-mezame.shardeum.org",
      chainId: Number(process.env.SHARDEUM_CHAIN_ID || 8119),
      accounts: sharedAccounts,
    },
  },
};
