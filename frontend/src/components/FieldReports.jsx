import { useEffect, useState } from "react";
import { shortAddress } from "../lib/formatters";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function formatCreatedAt(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function FieldReports({
  account,
  chainId,
  contractAddress,
  predictionId,
  predictionTitle,
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      if (!chainId || !contractAddress) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const searchParams = new URLSearchParams({
          chainId: String(chainId),
          contractAddress,
          predictionId: String(predictionId),
        });
        const response = await fetch(
          `${API_BASE_URL}/api/reports?${searchParams.toString()}`
        );
        const payload = await response.json();

        if (!response.ok) {
          if (!cancelled) {
            setAvailable(response.status !== 404);
            setError(payload.error || "Unable to load field reports.");
          }
          return;
        }

        if (!cancelled) {
          setAvailable(true);
          setReports(payload.reports || []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setAvailable(false);
          setError(
            "Field reports become available after deploying the app on Vercel with a database."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [chainId, contractAddress, predictionId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!account || !note.trim()) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainId: String(chainId),
          contractAddress,
          predictionId,
          predictionTitle,
          reporterAddress: account,
          note: note.trim(),
          sourceUrl: sourceUrl.trim(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit field report.");
      }

      setReports((current) => [payload.report, ...current].slice(0, 12));
      setNote("");
      setSourceUrl("");
      setAvailable(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!available && !reports.length) {
    return (
      <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-slate">
          Off-chain field reports
        </p>
        <p className="mt-3 text-sm leading-6 text-cloud">
          Deploy on Vercel and connect a Postgres database to enable this full-stack evidence feed.
        </p>
        {error ? <p className="mt-3 text-sm text-surge">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate">
            Off-chain field reports
          </p>
          <p className="mt-2 text-sm text-cloud">
            Community notes and source links stored in Postgres through Vercel serverless functions.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-[#0b1626] px-3 py-1 text-xs text-slate">
          {loading ? "Loading..." : `${reports.length} report${reports.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {reports.length ? (
        <div className="mt-4 space-y-3">
          {reports.map((report) => (
            <div
              className="rounded-2xl border border-white/10 bg-[#0b1626] p-4"
              key={report.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate">
                <span>{shortAddress(report.reporter_address)}</span>
                <span>{formatCreatedAt(report.created_at)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-cloud">{report.note}</p>
              {report.source_url ? (
                <a
                  className="mt-3 inline-block break-all text-sm text-rescue underline decoration-white/20 underline-offset-4"
                  href={report.source_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {report.source_url}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1626] p-4 text-sm text-slate">
          No field reports yet. Add one to give judges an off-chain evidence trail.
        </div>
      )}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <textarea
          className="input-shell min-h-24"
          disabled={!available || !account || submitting}
          maxLength={280}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            account
              ? "Example: Blood bank dashboard shows stock dropping below critical threshold."
              : "Connect a wallet to post a field report."
          }
          value={note}
        />
        <input
          className="input-shell"
          disabled={!available || !account || submitting}
          maxLength={280}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="Optional source URL"
          type="url"
          value={sourceUrl}
        />
        <button
          className="button-secondary w-full"
          disabled={!available || !account || !note.trim() || submitting}
          type="submit"
        >
          {submitting ? "Saving report..." : "Add Field Report"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-surge">{error}</p> : null}
    </section>
  );
}
