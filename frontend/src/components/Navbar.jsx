import { shortAddress } from "../lib/formatters";

export default function Navbar({
  account,
  currentNetwork,
  walletInstalled,
  onConnect,
  txState,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-white">
            RapidAid
          </p>
          <p className="text-sm text-slate">
            Emergency Prediction System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cloud sm:block">
            {currentNetwork}
          </div>

          <button
            className="button-primary"
            disabled={!walletInstalled || txState.loading}
            onClick={onConnect}
            type="button"
          >
            {account ? shortAddress(account) : "Connect MetaMask"}
          </button>
        </div>
      </div>
    </header>
  );
}
