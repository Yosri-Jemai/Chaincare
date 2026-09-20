// app/donations/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useReveal } from "@/app/hooks/useReveal";

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useReveal([donations, loading]);

  useEffect(() => {
    fetch("/api/init")
      .catch(() => {})
      .then(() => fetch("/api/donations"))
      .then((r) => r.json())
      .then((list) => setDonations(list.sort((a, b) => b.createdAt - a.createdAt)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>All donations</h1>
        </div>
        <div className="card">
          <div className="skeleton" style={{ width: "40%" }} />
          <div className="skeleton" style={{ width: "70%" }} />
          <div className="skeleton" style={{ width: "50%" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header reveal">
        <h1>All donations</h1>
        <p>Every donation recorded on ChainCare. Click any one to see its live timeline.</p>
      </div>

      {donations.length === 0 ? (
        <div className="empty reveal">
          <span className="empty-icon">📭</span>
          <p>No donations yet.</p>
          <a href="/donate" className="btn" style={{ marginTop: "1rem" }}>
            Make the first one →
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {donations.map((d, i) => (
            <a
              key={d.donationId}
              href={`/track/${d.donationId}`}
              className="card reveal"
              style={{
                marginBottom: 0,
                textDecoration: "none",
                color: "inherit",
                display: "block",
                transitionDelay: `${60 + i * 50}ms`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <span className="badge badge-live" style={{ flexShrink: 0 }}>
                      {d.ngoId}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                      {timeAgo(d.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.15rem" }}>
                    {d.cause}
                  </div>
                  <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {d.donationId}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text)" }}>
                    {Number(d.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    HBAR
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}