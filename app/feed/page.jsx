"use client";
import { useEffect, useState } from "react";

export default function FeedPage() {
  const [ngos, setNgos] = useState([]);
  const [feeInfo, setFeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/init").catch(() => {});
    fetch("/api/ngos")
      .then((r) => r.json())
      .then(({ ngos, feeInfo }) => { setNgos(ngos); setFeeInfo(feeInfo); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>
          <span className="text-gradient">Verified</span> causes
        </h1>
        <p>Every NGO is registered on-chain with a KYC hash. Anyone can verify.</p>
      </div>

      {feeInfo && (
        <div className="card card-glow">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="ngo-avatar" style={{ background: "linear-gradient(135deg, #10b981, #22d3ee)" }}>
              %
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.15rem" }}>
                {feeInfo.percent}% platform fee
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Fees flow to{" "}
                <span className="mono">
                  {feeInfo.collector.slice(0, 8)}…{feeInfo.collector.slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="skeleton" style={{ width: "40%" }} />
          <div className="skeleton" style={{ width: "70%" }} />
          <div className="skeleton" style={{ width: "50%" }} />
        </div>
      ) : ngos.length > 0 ? (
        <div className="ngo-grid">
          {ngos.map((n, i) => (
            <div
              key={n.ngoId}
              className="ngo-card"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="ngo-header">
                <div className="ngo-avatar">
                  {n.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <h3>{n.name}</h3>
                  <p>{n.description}</p>
                </div>
              </div>
              <div className="hash">
                KYC: {n.kycHash?.slice(0, 30)}…
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <span className="empty-icon">🏛️</span>
          <p>No NGOs registered yet.</p>
        </div>
      )}
    </div>
  );
}