import CreatePredictionForm from "./components/CreatePredictionForm";
import Navbar from "./components/Navbar";
import PredictionCard from "./components/PredictionCard";
import { NETWORKS } from "./config/networks";
import { useRapidAid } from "./hooks/useRapidAid";
import { formatStake, shortAddress } from "./lib/formatters";

function StatCard({ label, value, accent }) {
  return (
    <div className="panel p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-slate">{label}</p>
      <p className={`mt-3 font-display text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function App() {
  const {
    account,
    chainId,
    configuredAddress,
    connectWallet,
    contractReady,
    createPrediction,
    currentNetwork,
    error,
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
  } = useRapidAid();

  const canSwitch = preferredChainId && NETWORKS[preferredChainId];
  const showSwitch = canSwitch && (!chainId || !configuredAddress);

  return (
    <div className="min-h-screen bg-grid bg-[size:32px_32px]">
      <Navbar
        account={account}
        currentNetwork={currentNetwork}
        onConnect={connectWallet}
        txState={txState}
        walletInstalled={walletInstalled}
      />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.4em] text-rescue/80">
                Transparent emergency forecasting
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
                Spot likely shortages before they become crises.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-cloud/85">
                RapidAid uses on-chain staking to surface whether communities expect blood,
                oxygen, or other medical resource shortages. The strongest YES signals become
                instant frontline alerts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard accent="text-white" label="Predictions" value={summary.total} />
              <StatCard accent="text-rescue" label="Active" value={summary.active} />
              <StatCard accent="text-surge" label="High Risk" value={summary.highRisk} />
              <StatCard
                accent="text-white"
                label="Fixed Stake"
                value={`${formatStake(stakeAmount || 0n)} ETH/SHM`}
              />
            </div>

            {highRiskPredictions.length ? (
              <div className="panel border border-surge/25 bg-surge/10 p-5">
                <p className="font-display text-xl font-bold text-white">
                  Emergency signal active
                </p>
                <p className="mt-2 text-sm text-cloud">
                  {highRiskPredictions.length} live prediction
                  {highRiskPredictions.length > 1 ? "s are" : " is"} currently leaning YES,
                  which means bettors expect a likely shortage.
                </p>
              </div>
            ) : null}

            {!walletInstalled ? (
              <div className="panel border border-surge/20 bg-surge/10 p-5">
                <p className="font-semibold text-white">MetaMask not detected</p>
                <p className="mt-2 text-sm text-cloud">
                  Install MetaMask to use the live prediction market and transaction flow.
                </p>
              </div>
            ) : null}

            {showSwitch ? (
              <div className="panel p-5">
                <p className="font-semibold text-white">Switch to a configured network</p>
                <p className="mt-2 text-sm text-cloud">
                  The frontend currently has no deployed contract mapped for this chain.
                </p>
                <button
                  className="button-primary mt-4"
                  onClick={() => switchNetwork(preferredChainId)}
                  type="button"
                >
                  Switch to {NETWORKS[preferredChainId].chainName}
                </button>
              </div>
            ) : null}

            <div className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Live contract status</p>
                  <p className="mt-1 text-sm text-slate">{statusMessage}</p>
                </div>
                <div className="text-right text-sm text-cloud">
                  <p>Owner: {shortAddress(ownerAddress)}</p>
                  <p className="mt-1 break-all text-slate">
                    Contract: {configuredAddress || "Deploy and sync address"}
                  </p>
                </div>
              </div>
              {error ? <p className="mt-4 text-sm text-surge">{error}</p> : null}
            </div>
          </div>

          <CreatePredictionForm
            disabled={!contractReady || !account || txState.loading}
            onSubmit={createPrediction}
            txState={txState}
          />
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-rescue/80">
                Active market
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">
                Predictions and outcomes
              </h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cloud">
              {loadingPredictions ? "Refreshing..." : `${predictions.length} loaded`}
            </div>
          </div>

          {!predictions.length ? (
            <div className="panel p-8 text-center">
              <p className="font-display text-2xl font-bold text-white">
                No predictions on-chain yet
              </p>
              <p className="mt-3 text-sm leading-6 text-cloud">
                Create your first signal above, or run the demo seeding script after deployment to
                instantly populate the board for judging.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {predictions.map((prediction) => (
                <PredictionCard
                  account={account}
                  key={prediction.id}
                  onClaim={claimReward}
                  onResolve={resolvePrediction}
                  onStake={placeBet}
                  prediction={prediction}
                  stakeAmount={stakeAmount}
                  txState={txState}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
