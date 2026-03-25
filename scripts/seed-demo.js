const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const contractAddress =
    process.env.CONTRACT_ADDRESS || loadDeploymentAddress(chainId, hre.network.name);

  if (!contractAddress) {
    throw new Error(
      "No contract address found. Deploy first or pass CONTRACT_ADDRESS in your .env file."
    );
  }

  const contract = await hre.ethers.getContractAt(
    "RapidAidPredictionSystem",
    contractAddress
  );
  const signers = await hre.ethers.getSigners();
  const now = Math.floor(Date.now() / 1000);
  const startingCount = Number(await contract.getPredictionCount());

  const predictions = [
    {
      title: "Will City Hospital A need emergency blood units in the next 24 hours?",
      deadline: now + 60 * 60 * 24,
    },
    {
      title: "Will District Hospital B face an oxygen cylinder shortage by tomorrow evening?",
      deadline: now + 60 * 60 * 30,
    },
  ];

  for (const prediction of predictions) {
    const tx = await contract.createPrediction(prediction.title, prediction.deadline);
    await tx.wait();
  }

  const createdPredictionIds = predictions.map((_, index) => startingCount + index);

  if (["hardhat", "localhost"].includes(hre.network.name) && signers.length >= 4) {
    const stakeAmount = await contract.stakeAmount();
    const predictionZeroYes = await contract.connect(signers[1]).placeBet(createdPredictionIds[0], true, {
      value: stakeAmount,
    });
    await predictionZeroYes.wait();

    const predictionZeroYesTwo = await contract.connect(signers[2]).placeBet(createdPredictionIds[0], true, {
      value: stakeAmount,
    });
    await predictionZeroYesTwo.wait();

    const predictionZeroNo = await contract.connect(signers[3]).placeBet(createdPredictionIds[0], false, {
      value: stakeAmount,
    });
    await predictionZeroNo.wait();

    const predictionOneNo = await contract.connect(signers[1]).placeBet(createdPredictionIds[1], false, {
      value: stakeAmount,
    });
    await predictionOneNo.wait();

    const predictionOneYes = await contract.connect(signers[2]).placeBet(createdPredictionIds[1], true, {
      value: stakeAmount,
    });
    await predictionOneYes.wait();
  }

  console.log(`Seeded demo predictions into ${contractAddress} on ${hre.network.name}`);
}

function loadDeploymentAddress(chainId, networkName) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const preferred = path.join(deploymentsDir, `${chainId}.json`);
  const fallback = path.join(deploymentsDir, `${networkName}.json`);
  const filePath = fs.existsSync(preferred) ? preferred : fallback;

  if (!fs.existsSync(filePath)) {
    return "";
  }

  const deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return deployment.address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
