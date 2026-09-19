"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const STATUS_META = [
  { label: "Received",   cls: "badge-received" },
  { label: "Partial",    cls: "badge-partial" },
  { label: "Released",   cls: "badge-full" },
  { label: "Refunded",   cls: "badge-refund" },
];

export default function TrackPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/donation/${id}`);
        const d = await res.json();
        setData(d);
        setLastUpdate(new Date());
      } catch {}
    }
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [id]);

  if (!data) {
    return (
      <div className="card">
        <div className="skeleton" style={{ width: "30%", height: "1.5rem" }} />
        <div className="skeleton" style={{ width: "60%", marginTop: "1rem" }} />
        <div className="skeleton" style={{ width: "80%" }} />
        <div className="skeleton" style={{ width: "50%" }} />
      </div>
    );
  }

  const sMeta = data.onChain ? STATUS_META[data.onChain.status] : null;

  return (
    <div>
      <div className="page-header">
        <span className="badge badge-live" style={{ marginBottom: "0.75rem" }}>
          Live · refreshing every 3s
        </span>
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.35rem" }}>
          <span className="text-gradient">Donation</span> {id}
        </h1>
        {lastUpdate && (
          <p style={{ fontSize: "0.75rem" }}>
            Last updated {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {data.onChain && (
        <div className="card card-glow">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem" }}>On-chain state</h2>
            {sMeta && <span className={`badge ${sMeta.cls}`}>{sMeta.label}</span>}
          </div>

          <div className="kv">
            <span className="k">NGO</span>
            <span className="v">{data.onChain.ngoId}</span>

            <span className="k">Cause</span>
            <span className="v">{data.onChain.cause}</span>

            <span className="k">Donor</span>
            <span className="v mono">
              {data.onChain.donor.slice(0, 10)}…{data.onChain.donor.slice(-8)}
            </span>

            <span className="k">Escrowed</span>
            <span className="v"><strong>{data.onChain.amount}</strong> HBAR</span>

            <span className="k">Released</span>
            <span className="v"><strong>{data.onChain.released}</strong> HBAR</span>

            <span className="k">Platform fee</span>
            <span className="v">{data.onChain.platformFee} HBAR</span>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem" }}>Timeline</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            {data.timeline?.length ?? 0} event{data.timeline?.length === 1 ? "" : "s"}
          </span>
        </div>

        {data.timeline && data.timeline.length > 0 ? (
          <ol className="timeline">
            {data.timeline.map((ev, i) => (
              <li key={i} className="timeline-item">
                <span className="timeline-dot">{i + 1}</span>
                <p className="timeline-title">{ev.eventType.replace(/_/g, " ")}</p>
                <p className="timeline-desc">{ev.description}</p>
                <p className="timeline-meta">
                  <span>{new Date(ev.timestamp).toLocaleString()}</span>
                  <span>·</span>
                  <span className="mono">seq #{ev.sequenceNumber}</span>
                  {ev.contractTxId && (
                    <>
                      <span>·</span>
                      <a
                        href={`https://hashscan.io/testnet/transaction/${ev.contractTxId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on HashScan →
                      </a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty">
            <span className="empty-icon">⏳</span>
            <p>Waiting for the first event…</p>
          </div>
        )}
      </div>
    </div>
  );
}