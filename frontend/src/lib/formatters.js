import { ethers } from "ethers";

export function shortAddress(address = "") {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Number(timestamp) * 1000));
}

export function formatTimeLeft(timestamp) {
  const seconds = Number(timestamp) - Math.floor(Date.now() / 1000);

  if (seconds <= 0) {
    return "Closed";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

export function formatStake(value, digits = 4) {
  const amount = typeof value === "bigint" ? value : BigInt(value || 0);
  return Number(ethers.formatEther(amount)).toFixed(digits).replace(/\.?0+$/, "");
}

export function formatPercent(value) {
  return `${Number(value).toFixed(0)}%`;
}

export function makeExplorerLink(address) {
  if (!address) {
    return "";
  }

  return `https://explorer-unstable.shardeum.org/address/${address}`;
}
