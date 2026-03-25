import { useMemo, useState } from "react";
import {
  formatPercent,
  formatStake,
  formatTimeLeft,
  formatTimestamp,
  shortAddress,
} from "../lib/formatters";
import FieldReports from "./FieldReports";

function ProofField({ proof }) {
  if (!proof) {
    return null;
  }

  const isUrl = proof.startsWith("http://") || proof.startsWith("https://");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-cloud">
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate">
        Proof
      </p>
      {isUrl ? (
        <a
          className="break-all text-rescue underline decoration-white/20 underline-offset-4"
          href={proof}
          rel="noreferrer"
          target="_blank"
        >
          {proof}
        </a>
      ) : (
        <p>{proof}</p>
      )}
    </div>
  );
}

export default function PredictionCard({
  account,
  chainId,
  contractAddress,
  onClaim,
  onResolve,
  onStake,
  prediction,
  stakeAmount,
  txState,
}) {
  const [proof, setProof] = useState("");
  const [winningOption, setWinningOption] = useState(true);
  const fixedStakeLabel = useMemo(() => formatStake(stakeAmount || 0n), [stakeAmount]);
  const userBetLabel = prediction.userBet?.option ? prediction.yesLabel : prediction.noLabel;
  const canClaim =
    prediction.userBet?.exists &&
    !prediction.userBet?.claimed &&
    prediction.resolved &&
    (prediction.refundOnly || prediction.userBet.option === prediction.winningOption);

  async function handleResolve(event) {
    event.preventDefault();

    if (!proof.trim()) {
      return;
    }

    await onResolve(prediction.id, winningOption, proof.trim());
    setProof("");
  }

  return (
    <article className="panel panel-glow overflow-hidden p-6">
      {prediction.isHighRisk && !prediction.resolved ? (
        <div className="mb-5 rounded-2xl border border-surge/30 bg-surge/10 p-4">
          <p className="text-sm font-semibold text-surge">
            High probability of resource shortage
          </p>
          <p className="mt-1 text-sm text-cloud">
            Most staked liquidity currently expects an emergency signal on YES.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rescue/80">
            Prediction #{prediction.id}
          </p>
          <h3 className="mt-2 font-display text-xl font-bold text-white">
            {prediction.title}
          </h3>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${
            prediction.resolved
              ? "bg-rescue/15 text-rescue"
              : "bg-white/10 text-cloud"
          }`}
        >
          {prediction.resolved ? "Resolved" : "Active"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-cloud sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate">Creator</p>
          <p className="mt-2 font-medium text-white">{shortAddress(prediction.creator)}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate">Deadline</p>
          <p className="mt-2 font-medium text-white">{formatTimestamp(prediction.deadline)}</p>
          <p className="mt-1 text-xs text-slate">{formatTimeLeft(prediction.deadline)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-[#0b1626] p-5">
        <div className="flex items-center justify-between text-sm text-cloud">
          <span>{prediction.yesLabel}</span>
          <span>{formatPercent(prediction.yesShare)}</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-white/10">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-surge to-ember"
            style={{ width: `${prediction.yesShare}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate">{formatStake(prediction.totalYesStake)} staked</p>

        <div className="mt-5 flex items-center justify-between text-sm text-cloud">
          <span>{prediction.noLabel}</span>
          <span>{formatPercent(prediction.noShare)}</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-white/10">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-rescue to-cyan-200"
            style={{ width: `${prediction.noShare}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate">{formatStake(prediction.totalNoStake)} staked</p>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cloud">
          <span>Total pool</span>
          <span className="font-semibold text-white">
            {formatStake(prediction.totalPool)} ETH / SHM
          </span>
        </div>
      </div>

      {!prediction.resolved ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="button-primary"
            disabled={!account || txState.loading || prediction.userBet?.exists}
            onClick={() => onStake(prediction.id, true)}
            type="button"
          >
            Stake {fixedStakeLabel} on YES
          </button>
          <button
            className="button-secondary"
            disabled={!account || txState.loading || prediction.userBet?.exists}
            onClick={() => onStake(prediction.id, false)}
            type="button"
          >
            Stake {fixedStakeLabel} on NO
          </button>
        </div>
      ) : null}

      {prediction.userBet?.exists ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-cloud">
          <p className="text-xs uppercase tracking-[0.25em] text-slate">Your stake</p>
          <p className="mt-2 text-white">
            {formatStake(prediction.userBet.amount)} on {userBetLabel}
          </p>
          <p className="mt-1 text-slate">
            {prediction.userBet.claimed
              ? "Reward claimed"
              : prediction.resolved
                ? canClaim
                  ? "Eligible to claim"
                  : "This wallet did not land on the winning side"
                : "Waiting for resolution"}
          </p>
        </div>
      ) : null}

      {prediction.resolved ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-rescue/20 bg-rescue/10 p-4 text-sm text-cloud">
            <p className="text-xs uppercase tracking-[0.25em] text-rescue">
              Result
            </p>
            <p className="mt-2 text-white">
              {prediction.refundOnly
                ? "Refund mode triggered because nobody backed the winning side."
                : `Winning side: ${prediction.winningOption ? prediction.yesLabel : prediction.noLabel}`}
            </p>
          </div>

          <ProofField proof={prediction.proof} />

          {canClaim ? (
            <button
              className="button-primary w-full"
              disabled={txState.loading}
              onClick={() => onClaim(prediction.id)}
              type="button"
            >
              {txState.loading ? txState.label : "Claim Reward"}
            </button>
          ) : null}
        </div>
      ) : null}

      {prediction.isOwner && !prediction.resolved ? (
        <form className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5" onSubmit={handleResolve}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-white">Owner resolution panel</p>
            <p className="text-xs text-slate">
              {prediction.canResolve ? "Ready to resolve" : "Available after deadline"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                winningOption
                  ? "border-surge bg-surge/10 text-surge"
                  : "border-white/10 bg-[#0b1626] text-cloud"
              }`}
              onClick={() => setWinningOption(true)}
              type="button"
            >
              Winner: YES
            </button>

            <button
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                !winningOption
                  ? "border-rescue bg-rescue/10 text-rescue"
                  : "border-white/10 bg-[#0b1626] text-cloud"
              }`}
              onClick={() => setWinningOption(false)}
              type="button"
            >
              Winner: NO
            </button>
          </div>

          <textarea
            className="input-shell min-h-28"
            onChange={(event) => setProof(event.target.value)}
            placeholder="Paste a report URL, hospital notice, or short proof text."
            value={proof}
          />

          <button
            className="button-primary w-full"
            disabled={!prediction.canResolve || txState.loading}
            type="submit"
          >
            {txState.loading ? txState.label : "Resolve Prediction"}
          </button>
        </form>
      ) : null}

      <FieldReports
        account={account}
        chainId={chainId}
        contractAddress={contractAddress}
        predictionId={prediction.id}
        predictionTitle={prediction.title}
      />
    </article>
  );
}
