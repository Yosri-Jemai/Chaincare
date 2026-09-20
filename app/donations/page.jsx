// app/donations/page.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
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

function shortAddr(a) {
  if (!a) return "—";
  return a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");     // donor address substring
  const [ngoFilter, setNgoFilter] = useState(""); // selected ngoId

  useReveal([donations, loading]);

  useEffect(() => {
    fetch("/api/init").catch(() => {});
    Promise.all([
      fetch("/api/donations").then((r) => r.json()).catch(() => []),
      fetch("/api/ngos").then((r) => r.json()).catch(() => ({ ngos: [] })),
    ])
      .then(([donationList, ngoRes]) => {
        setDonations(
          [...donationList].sort((a, b) => b.createdAt - a.createdAt)
        );
        setNgos(ngoRes.ngos ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  // ngoId → { name, description } lookup
  const ngoById = useMemo(() => {
    const m = new Map();
    for (const n of ngos) m.set(n.ngoId, n);
    return m;
  }, [ngos]);

  // Apply both filters together
  const filtered = useMemo(() => {
    return donations.filter((d) => {
      if (ngoFilter && d.ngoId !== ngoFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const addr = (d.donorAddress ?? "").toLowerCase();
        const ngoName = (ngoById.get(d.ngoId)?.name ?? "").toLowerCase();
        const ngoId = (d.ngoId ?? "").toLowerCase();
        const cause = (d.cause ?? "").toLowerCase();
        if (
          !addr.includes(q) &&
          !ngoName.includes(q) &&
          !ngoId.includes(q) &&
          !cause.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [donations, search, ngoFilter, ngoById]);

  const clearFilters = () => {
    setSearch("");
    setNgoFilter("");
  };
  const filtersActive = search.trim() !== "" || ngoFilter !== "";

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

      {/* ─── Filters ─── */}
      {donations.length > 0 && (
        <div className="card reveal" style={{ transitionDelay: "60ms", padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 240px", minWidth: 200 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by donor address, cause, or NGO…"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(0,0,0,0.25)",
                  color: "var(--text)",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div style={{ flex: "1 1 180px", minWidth: 160 }}>
              <select
                value={ngoFilter}
                onChange={(e) => setNgoFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 2.5rem 0.75rem 1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(0,0,0,0.25)",
                  color: "var(--text)",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L2 4h8z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                }}
              >
                <option value="">All NGOs</option>
                {ngos.map((n) => (
                  <option key={n.ngoId} value={n.ngoId}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-secondary"
                style={{ padding: "0 1rem", fontSize: "0.85rem" }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="hint" style={{ marginTop: "0.6rem", fontSize: "0.75rem" }}>
            Showing <strong>{filtered.length}</strong> of {donations.length}{" "}
            {donations.length === 1 ? "donation" : "donations"}
            {filtersActive ? " (filtered)" : ""}
          </div>
        </div>
      )}

      {donations.length === 0 ? (
        <div className="empty reveal">
          <span className="empty-icon">📭</span>
          <p>No donations yet.</p>
          <a href="/donate" className="btn" style={{ marginTop: "1rem" }}>
            Make the first one →
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty reveal">
          <span className="empty-icon">🔍</span>
          <p>No donations match your filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{ marginTop: "1rem" }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filtered.map((d, i) => {
            const ngo = ngoById.get(d.ngoId);
            return (
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      <span className="badge badge-live" style={{ flexShrink: 0 }}>
                        {ngo?.name ?? d.ngoId}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        {timeAgo(d.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.15rem" }}>
                      {d.cause}
                    </div>
                    <div className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                      Donor: {shortAddr(d.donorAddress)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}