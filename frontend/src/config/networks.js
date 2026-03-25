export const NETWORKS = {
  31337: {
    chainId: "0x7a69",
    chainName: "Hardhat Localhost",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
  8119: {
    chainId: "0x1fb7",
    chainName: "Shardeum Testnet",
    rpcUrls: ["https://api-mezame.shardeum.org"],
    nativeCurrency: {
      name: "Shardeum",
      symbol: "SHM",
      decimals: 18,
    },
    blockExplorerUrls: ["https://explorer-unstable.shardeum.org"],
  },
};
