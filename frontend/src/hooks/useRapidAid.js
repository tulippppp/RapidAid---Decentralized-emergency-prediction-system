import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import contractArtifact from "../config/RapidAidPredictionSystem.json";
import contractAddresses from "../config/contract-addresses.json";
import { NETWORKS } from "../config/networks";

const EMPTY_TX = { loading: false, label: "" };

function getWallet() {
  return window.ethereum;
}

function getConfiguredAddress(chainId) {
  return contractAddresses[String(chainId)] || "";
}

function normalisePrediction(prediction, index, ownerAddress, connectedAccount, userBet) {
  const totalYesStake = BigInt(prediction.totalYesStake);
  const totalNoStake = BigInt(prediction.totalNoStake);
  const totalPool = BigInt(prediction.totalPool);
  const totalPoolNumber = Number(ethers.formatEther(totalPool || 0n));
  const yesShare =
    totalPool > 0n ? Number((totalYesStake * 100n) / totalPool) : 0;
  const noShare = totalPool > 0n ? 100 - yesShare : 0;
  const isHighRisk = totalYesStake > totalNoStake && totalPool > 0n;

  return {
    id: index,
    title: prediction.title,
    yesLabel: prediction.yesLabel,
    noLabel: prediction.noLabel,
    creator: prediction.creator,
    createdAt: Number(prediction.createdAt),
    deadline: Number(prediction.deadline),
    resolved: prediction.resolved,
    winningOption: prediction.winningOption,
    refundOnly: prediction.refundOnly,
    proof: prediction.proof,
    totalYesStake,
    totalNoStake,
    totalPool,
    totalPoolNumber,
    yesShare,
    noShare,
    isHighRisk,
    canResolve: !prediction.resolved && Date.now() / 1000 >= Number(prediction.deadline),
    isOwner:
      ownerAddress &&
      connectedAccount &&
      ownerAddress.toLowerCase() === connectedAccount.toLowerCase(),
    userBet: userBet
      ? {
          exists: userBet.exists,
          option: userBet.option,
          claimed: userBet.claimed,
          amount: BigInt(userBet.amount || 0),
        }
      : null,
  };
}

export function useRapidAid() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [stakeAmount, setStakeAmount] = useState(0n);
  const [txState, setTxState] = useState(EMPTY_TX);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Connect MetaMask to create, stake, resolve, and claim."
  );
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  const walletInstalled = Boolean(getWallet());
  const configuredAddress = useMemo(
    () => (chainId ? getConfiguredAddress(chainId) : ""),
    [chainId]
  );
  const preferredChainId = useMemo(() => {
    if (contractAddresses["8119"]) {
      return 8119;
    }

    if (contractAddresses["31337"]) {
      return 31337;
    }

    return null;
  }, []);
  const contractReady = Boolean(configuredAddress && contractArtifact.abi.length);

  const initialiseWallet = useCallback(async (requestAccess = false) => {
    const wallet = getWallet();

    if (!wallet) {
      setStatusMessage("MetaMask is required to use the live blockchain flow.");
      return;
    }

    const browserProvider = new BrowserProvider(wallet);
    const network = await browserProvider.getNetwork();
    const method = requestAccess ? "eth_requestAccounts" : "eth_accounts";
    const accounts = await browserProvider.send(method, []);

    setProvider(browserProvider);
    setChainId(Number(network.chainId));
    setAccount(accounts[0] || "");
  }, []);

  const fetchPredictions = useCallback(async () => {
    if (!walletInstalled) {
      return;
    }

    const browserProvider = provider || new BrowserProvider(getWallet());
    const network = await browserProvider.getNetwork();
    const currentChainId = Number(network.chainId);
    const contractAddress = getConfiguredAddress(currentChainId);

    setProvider(browserProvider);
    setChainId(currentChainId);

    if (!contractArtifact.abi.length) {
      setPredictions([]);
      setStatusMessage("Deploy the contract first so the frontend can sync its ABI.");
      return;
    }

    if (!contractAddress) {
      setPredictions([]);
      setStatusMessage(
        "No contract is configured for this network yet. Deploy first, then refresh."
      );
      return;
    }

    setLoadingPredictions(true);
    setError("");

    try {
      const readContract = new Contract(
        contractAddress,
        contractArtifact.abi,
        browserProvider
      );

      const [owner, fixedStake, rawPredictions] = await Promise.all([
        readContract.owner(),
        readContract.stakeAmount(),
        readContract.getAllPredictions(),
      ]);

      const currentAccount = account || (await browserProvider.send("eth_accounts", []))[0] || "";
      const userBets = currentAccount
        ? await Promise.all(
            rawPredictions.map((_, index) => readContract.getUserBet(index, currentAccount))
          )
        : [];

      const mappedPredictions = rawPredictions
        .map((prediction, index) =>
          normalisePrediction(prediction, index, owner, currentAccount, userBets[index])
        )
        .sort((left, right) => {
          if (left.resolved !== right.resolved) {
            return left.resolved ? 1 : -1;
          }

          return left.deadline - right.deadline;
        });

      setOwnerAddress(owner);
      setStakeAmount(fixedStake);
      setPredictions(mappedPredictions);
      setStatusMessage(
        mappedPredictions.length
          ? "Live data loaded from the smart contract."
          : "No predictions yet. Create one or run the demo seeding script."
      );
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load predictions.");
      setStatusMessage("The frontend could not reach the contract cleanly.");
    } finally {
      setLoadingPredictions(false);
    }
  }, [account, provider, walletInstalled]);

  useEffect(() => {
    initialiseWallet(false).catch(() => {
      setStatusMessage("Wallet connection is optional until you need to sign.");
    });
  }, [initialiseWallet]);

  useEffect(() => {
    if (!walletInstalled) {
      return undefined;
    }

    const wallet = getWallet();

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || "");
      setRefreshIndex((current) => current + 1);
    };

    const handleChainChanged = () => {
      setRefreshIndex((current) => current + 1);
    };

    wallet.on("accountsChanged", handleAccountsChanged);
    wallet.on("chainChanged", handleChainChanged);

    return () => {
      wallet.removeListener("accountsChanged", handleAccountsChanged);
      wallet.removeListener("chainChanged", handleChainChanged);
    };
  }, [walletInstalled]);

  useEffect(() => {
    if (!walletInstalled) {
      return;
    }

    fetchPredictions();

    const intervalId = window.setInterval(() => {
      fetchPredictions();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchPredictions, refreshIndex, walletInstalled]);

  const withTransaction = useCallback(async (label, task) => {
    setTxState({ loading: true, label });
    setError("");

    try {
      await task();
      await fetchPredictions();
    } catch (txError) {
      setError(txError.shortMessage || txError.message || "Transaction failed.");
      throw txError;
    } finally {
      setTxState(EMPTY_TX);
    }
  }, [fetchPredictions]);

  const getWriteContract = useCallback(async () => {
    const wallet = getWallet();

    if (!walletInstalled || !wallet) {
      throw new Error("MetaMask is not available in this browser.");
    }

    const browserProvider = provider || new BrowserProvider(wallet);
    const signer = await browserProvider.getSigner();
    const network = await browserProvider.getNetwork();
    const activeChainId = Number(network.chainId);
    const contractAddress = getConfiguredAddress(activeChainId);

    if (!contractAddress) {
      throw new Error("No deployed contract is configured for the current network.");
    }

    return {
      browserProvider,
      contract: new Contract(contractAddress, contractArtifact.abi, signer),
    };
  }, [provider, walletInstalled]);

  const connectWallet = useCallback(async () => {
    await initialiseWallet(true);
    setRefreshIndex((current) => current + 1);
  }, [initialiseWallet]);

  const switchNetwork = useCallback(async (targetChainId) => {
    const wallet = getWallet();
    const config = NETWORKS[targetChainId];

    if (!wallet || !config) {
      return;
    }

    try {
      await wallet.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: config.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await wallet.request({
          method: "wallet_addEthereumChain",
          params: [config],
        });
      } else {
        throw switchError;
      }
    }

    setRefreshIndex((current) => current + 1);
  }, []);

  const createPrediction = useCallback(async ({ title, deadline }) => {
    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

    if (!deadlineTimestamp || Number.isNaN(deadlineTimestamp)) {
      throw new Error("Please choose a valid deadline.");
    }

    await withTransaction("Creating prediction...", async () => {
      const { contract } = await getWriteContract();
      const tx = await contract.createPrediction(title, deadlineTimestamp);
      await tx.wait();
    });
  }, [getWriteContract, withTransaction]);

  const placeBet = useCallback(async (predictionId, option) => {
    await withTransaction("Submitting stake...", async () => {
      const { contract } = await getWriteContract();
      const liveStakeAmount = await contract.stakeAmount();
      const tx = await contract.placeBet(predictionId, option, {
        value: liveStakeAmount,
      });
      await tx.wait();
    });
  }, [getWriteContract, withTransaction]);

  const resolvePrediction = useCallback(async (predictionId, winningOption, proof) => {
    await withTransaction("Resolving prediction...", async () => {
      const { contract } = await getWriteContract();
      const tx = await contract.resolvePrediction(predictionId, winningOption, proof);
      await tx.wait();
    });
  }, [getWriteContract, withTransaction]);

  const claimReward = useCallback(async (predictionId) => {
    await withTransaction("Claiming reward...", async () => {
      const { contract } = await getWriteContract();
      const tx = await contract.claimReward(predictionId);
      await tx.wait();
    });
  }, [getWriteContract, withTransaction]);

  const highRiskPredictions = useMemo(
    () => predictions.filter((prediction) => !prediction.resolved && prediction.isHighRisk),
    [predictions]
  );

  const summary = useMemo(() => {
    const active = predictions.filter((prediction) => !prediction.resolved).length;
    const resolved = predictions.length - active;

    return {
      total: predictions.length,
      active,
      resolved,
      highRisk: highRiskPredictions.length,
    };
  }, [highRiskPredictions.length, predictions]);

  return {
    account,
    chainId,
    configuredAddress,
    connectWallet,
    contractReady,
    createPrediction,
    currentNetwork: chainId ? NETWORKS[chainId]?.chainName || "Custom network" : "No network",
    error,
    fetchPredictions,
    highRiskPredictions,
    loadingPredictions,
    ownerAddress,
    placeBet,
    preferredChainId,
    predictions,
    resolvePrediction,
    claimReward,
    stakeAmount,
    statusMessage,
    summary,
    switchNetwork,
    txState,
    walletInstalled,
  };
}
