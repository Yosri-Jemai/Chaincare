"use client";
import { useEffect, useState } from "react";

const EVENT_TYPES = [
  { value: "funds_allocated",         label: "Funds allocated",           releases: false },
  { value: "funds_used",              label: "Funds used",                releases: true  },
  { value: "distribution_started",    label: "Distribution started",      releases: false },
  { value: "distribution_completed",  label: "Distribution completed",    releases: true  },
  { value: "impact_reported",         label: "Impact reported",           releases: false },
];

export default function NGOConsole() {
  const [donations, setDonations] = useState([]);
  const [donationId, setDonationId] = useState("");
  const [eventType, setEventType] = useState("funds_used");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState("info");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/init")
      .then(() => fetch("/api/donations"))
      .then((r) => r.json())
      .then(setDonations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = EVENT_TYPES.find((e) => e.value === eventType);
  const needsAmount = selected?.releases;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setStatusKind("info");
    setStatus("Submitting…");
    try {
      const res = await fetch("/api/ngo-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId,
          eventType,
          description,
          amount: amount ? Number(amount) : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatusKind("success");
      setStatus(data.contractTxId ? "Logged + funds released on-chain ✓" : "Logged to HCS ✓");
      setDescription("");
      setAmount("");
    } catch (err) {
      setStatusKind("error");
      setStatus("❌ " + (err.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ width: "40%" }} />
        <div className="skeleton" style={{ width: "70%" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>NGO Console</h1>
        <p>Log progress on a donation. Releases money from escrow when applicable.</p>
      </div>

      <form onSubmit={submit}>
        <div className="field">
          <label>Donation</label>
          {donations.length > 0 ? (
            <select
              value={donationId}
              onChange={(e) => setDonationId(e.target.value)}
              required
            >
              <option value="">Choose a donation…</option>
              {donations.map((d) => (
                <option key={d.donationId} value={d.donationId}>
                  {d.donationId} — {d.cause}
                </option>
              ))}
            </select>
          ) : (
            <div className="empty" style={{ padding: "1.5rem" }}>
              <span className="empty-icon">💸</span>
              <p>No donations yet. Make one from the Donate page first.</p>
            </div>
          )}
        </div>

        <div className="field">
          <label>Event type</label>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}{t.releases ? " · releases funds" : ""}
              </option>
            ))}
          </select>
        </div>

        {needsAmount && (
          <div className="field">
            <label>Amount to release</label>
            <div className="amount-input-wrap">
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <span className="suffix">HBAR</span>
            </div>
            <p className="hint">
              This amount will move from escrow to the NGO wallet.
            </p>
          </div>
        )}

        <div className="field">
          <label>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened?"
            required
          />
        </div>

        <button type="submit" className="btn btn-full" disabled={busy || !donationId}>
          {busy ? (
            <>
              <span className="spinner" />
              Logging…
            </>
          ) : (
            <>Log event on Hedera</>
          )}
        </button>
      </form>

      {status && (
        <div className={`status ${statusKind === "error" ? "error" : statusKind === "success" ? "success" : ""}`}>
          {status}
        </div>
      )}
    </div>
  );
}