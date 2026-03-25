import { useMemo, useState } from "react";

function makeFutureDate(minutesFromNow) {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function CreatePredictionForm({ disabled, onSubmit, txState }) {
  const initialDeadline = useMemo(() => makeFutureDate(60), []);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(initialDeadline);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      deadline,
    });

    setTitle("");
    setDeadline(makeFutureDate(60));
  }

  return (
    <section className="panel panel-glow p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-rescue/80">
          Create Signal
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">
          Publish an emergency prediction
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate">
          Keep the question crisp so bettors can understand the real-world decision quickly.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-cloud" htmlFor="title">
            Prediction title
          </label>
          <input
            className="input-shell"
            id="title"
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Will Hospital A need blood in the next 24 hours?"
            required
            type="text"
            value={title}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-cloud" htmlFor="deadline">
            Deadline
          </label>
          <input
            className="input-shell"
            id="deadline"
            min={makeFutureDate(5)}
            onChange={(event) => setDeadline(event.target.value)}
            required
            type="datetime-local"
            value={deadline}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[15, 60, 240, 1440].map((minutes) => (
            <button
              className="button-secondary"
              key={minutes}
              onClick={() => setDeadline(makeFutureDate(minutes))}
              type="button"
            >
              {minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${minutes / 60}h` : "24h"}
            </button>
          ))}
        </div>

        <button className="button-primary w-full" disabled={disabled} type="submit">
          {txState.loading ? txState.label : "Create Prediction"}
        </button>
      </form>
    </section>
  );
}
