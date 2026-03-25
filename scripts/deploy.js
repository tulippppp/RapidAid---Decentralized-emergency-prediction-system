const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const stakeAmount = hre.ethers.parseEther(process.env.STAKE_AMOUNT || "0.01");

  const RapidAidPredictionSystem = await hre.ethers.getContractFactory(
    "RapidAidPredictionSystem"
  );
  const contract = await RapidAidPredictionSystem.deploy(stakeAmount);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deploymentInfo = {
    name: "RapidAidPredictionSystem",
    address: contractAddress,
    chainId,
    network: hre.network.name,
    deployer: deployer.address,
    stakeAmount: hre.ethers.formatEther(stakeAmount),
    deployedAt: new Date().toISOString(),
  };

  persistDeployment(deploymentInfo);
  await syncFrontend(contractAddress, chainId);

  console.log("RapidAidPredictionSystem deployed");
  console.log(`Network: ${hre.network.name} (${chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Fixed stake: ${deploymentInfo.stakeAmount}`);
}

function persistDeployment(deploymentInfo) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const chainFile = path.join(deploymentsDir, `${deploymentInfo.chainId}.json`);
  const networkFile = path.join(deploymentsDir, `${deploymentInfo.network}.json`);

  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(chainFile, JSON.stringify(deploymentInfo, null, 2));
  fs.writeFileSync(networkFile, JSON.stringify(deploymentInfo, null, 2));
}

async function syncFrontend(contractAddress, chainId) {
  const frontendConfigDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config"
  );
  const addressesPath = path.join(frontendConfigDir, "contract-addresses.json");
  const abiPath = path.join(frontendConfigDir, "RapidAidPredictionSystem.json");
  const existingAddresses = fs.existsSync(addressesPath)
    ? JSON.parse(fs.readFileSync(addressesPath, "utf8"))
    : {};
  const artifact = await hre.artifacts.readArtifact("RapidAidPredictionSystem");

  existingAddresses[chainId] = contractAddress;

  fs.mkdirSync(frontendConfigDir, { recursive: true });
  fs.writeFileSync(addressesPath, JSON.stringify(existingAddresses, null, 2));
  fs.writeFileSync(abiPath, JSON.stringify({ abi: artifact.abi }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
