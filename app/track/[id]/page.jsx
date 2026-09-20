"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useReveal } from "@/app/hooks/useReveal";

const STATUS_META = [
  { label: "Received", cls: "badge-received" },
  { label: "Partial",  cls: "badge-partial" },
  { label: "Released", cls: "badge-full" },
  { label: "Refunded", cls: "badge-refund" },
];

function shortAddr(a) {
  if (!a) return "—";
  return a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
}

export default function TrackPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const viewerFromUrl = searchParams.get("viewer");

  const [data, setData] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [nft, setNft] = useState(null);
  const [nftState, setNftState] = useState("loading"); // loading | loaded | error
  const [viewer, setViewer] = useState(viewerFromUrl ?? null);
  const [walletChecked, setWalletChecked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const ticketRef = useRef(null);

  useReveal([data, nft, viewer, nftState]);

  // NGO lookup
  useEffect(() => {
    fetch("/api/ngos")
      .then((r) => r.json())
      .then((res) => setNgos(res.ngos ?? []))
      .catch(() => {});
  }, []);

  // Timeline poll
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/donation/${id}`);
        setData(await res.json());
        setLastUpdate(new Date());
      } catch {}
    }
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [id]);

  // Detect wallet viewer
  useEffect(() => {
    if (viewer) {
      setWalletChecked(true);
      return;
    }

    if (typeof window === "undefined") {
      setWalletChecked(true);
      return;
    }
    if (!window.ethereum) {
      setWalletChecked(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        let accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) {
          // Silent — returns instantly when the site is already authorized
          accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        }
        if (!cancelled && accounts?.[0]) setViewer(accounts[0]);
      } catch {
        // User rejected, wallet locked, or other — nothing to do
      } finally {
        if (!cancelled) setWalletChecked(true);
      }
    })();

    const onAccountsChanged = (accounts) => {
      if (accounts?.[0]) setViewer(accounts[0]);
    };
    window.ethereum.on?.("accountsChanged", onAccountsChanged);

    return () => {
      cancelled = true;
      window.ethereum.removeListener?.("accountsChanged", onAccountsChanged);
    };
  }, [viewer]);

  // Fetch NFT
  useEffect(() => {
    if (!walletChecked) return;

    let cancelled = false;
    let timer = null;

    async function load() {
      setNftState("loading");
      try {
        const url = viewer
          ? `/api/nft/${id}?viewer=${viewer}`
          : `/api/nft/${id}`;
        const r = await fetch(url);
        if (!r.ok) {
          if (!cancelled) { setNft(null); setNftState("error"); }
          return;
        }
        const j = await r.json();
        if (cancelled) return;
        setNft(j);
        setNftState("loaded");
        if (j.ownership === "unresolved") {
          timer = setTimeout(load, 4000);
        }
      } catch {
        if (!cancelled) { setNft(null); setNftState("error"); }
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, viewer, walletChecked]);

  const ngo = useMemo(
    () => ngos.find((n) => n.ngoId === data?.onChain?.ngoId),
    [ngos, data?.onChain?.ngoId]
  );

  async function downloadCertificate() {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 2,
        backgroundColor: "#080b18",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `chaincare-receipt-${id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("download failed:", err);
      alert("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  }

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
  const ownership = nft?.ownership ?? null;
  const isOwner = ownership === "owner";
  const isOther = ownership === "other";
  const isUnresolved = ownership === "unresolved";
  const isDisconnected = ownership === "disconnected";

  return (
    <div>
      <div className="page-header reveal">
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

      {/* ─── ON-CHAIN STATE ─── */}
      {data.onChain && (
        <div className="card card-glow reveal" style={{ transitionDelay: "60ms" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem" }}>On-chain state</h2>
            {sMeta && <span className={`badge ${sMeta.cls}`}>{sMeta.label}</span>}
          </div>

          <div className="kv">
            <span className="k">NGO</span>
            <span className="v">
              {ngo?.name ?? data.onChain.ngoId}
              {ngo && (
                <span
                  className="mono"
                  style={{ color: "var(--text-dim)", fontSize: "0.72rem", marginLeft: "0.5rem" }}
                >
                  ({data.onChain.ngoId})
                </span>
              )}
            </span>

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

            <span className="k">Remaining</span>
            <span className="v">
              <strong style={{ color: "var(--accent)" }}>
                {(Number(data.onChain.amount) - Number(data.onChain.released)).toFixed(4)}
              </strong>{" "}
              HBAR
            </span>

            <span className="k">Platform fee</span>
            <span className="v">{data.onChain.platformFee} HBAR</span>
          </div>
        </div>
      )}

      {/* ─── TIMELINE ─── */}
      <div className="card reveal" style={{ transitionDelay: "120ms" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem" }}>Timeline</h2>
          <a
            href={`https://hashscan.io/testnet/topic/${process.env.NEXT_PUBLIC_HCS_TOPIC_ID}`}
            target="_blank"
            rel="noreferrer"
            className="hint"
            style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
          >
            View full HCS log →
          </a>
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

      {/* ─── NFT CERTIFICATE (owner only) ─── */}
      <div className="reveal" style={{ transitionDelay: "180ms" }}>
        {/* Loading */}
        {(nftState === "loading" || !walletChecked) && (
          <div className="cert-loading">
            <div className="cert-loading-pulse" />
            <span>Loading your receipt…</span>
          </div>
        )}

        {/* Error — no NFT minted for this donation */}
        {nftState === "error" && walletChecked && (
          <div className="cert-note">
            Receipt will appear a few seconds after the donation is confirmed.
          </div>
        )}

        {/* Unresolved (Mirror Node lagging) */}
        {nftState === "loaded" && isUnresolved && (
          <div className="cert-note">
            Receipt exists on-chain. Waiting for the network to index it…
          </div>
        )}

        {/* Other wallet */}
        {nftState === "loaded" && isOther && (
          <div className="cert-note">
            This receipt belongs to{" "}
            <span className="mono">{shortAddr(nft.ownerEvm ?? nft.owner)}</span>.
          </div>
        )}

        {/* No viewer known */}
        {nftState === "loaded" && isDisconnected && (
          <div className="cert-note">
            This receipt belongs to the wallet that made the donation. Open this
            page in that wallet&apos;s browser to see it.
          </div>
        )}

        {/* Owner — full certificate */}
        {nftState === "loaded" && isOwner && nft?.qrDataUrl && (
        <>
          {!showCertificate ? (
            <div className="cert-reveal-wrap">
              <div className="cert-reveal-icon">🎖️</div>
              <h3 className="cert-reveal-title">Your certificate is ready</h3>
              <p className="cert-reveal-text">
                A verifiable receipt for this donation, signed by the Hedera network.
              </p>
              <button
                onClick={() => setShowCertificate(true)}
                className="btn cert-reveal-btn"
              >
                Show certificate
              </button>
            </div>
          ) : (
            <>
              <div className="certificate" ref={ticketRef}>
                <div className="cert-frame">
                  <div className="cert-top">
                    <div className="cert-brand-mark">
                      <span className="cert-brand-dot" />
                      ChainCare
                    </div>
                    <div className="cert-serial">Serial №&nbsp;{nft.serial}</div>
                  </div>

                  <div className="cert-rule" />

                  <div className="cert-emblem">
                    <div className="cert-emblem-ring">
                      <div className="cert-emblem-core">✓</div>
                    </div>
                  </div>

                  <h2 className="cert-title">Certificate of Impact</h2>
                  <p className="cert-issued">
                    Issued on Hedera ·{" "}
                    {new Date(data.onChain?.createdAt || Date.now()).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>

                  <div className="cert-ornament">
                    <span className="cert-ornament-line" />
                    <span className="cert-ornament-dot">✦</span>
                    <span className="cert-ornament-line" />
                  </div>

                  <p className="cert-label">Presented to the wallet</p>
                  <p className="cert-wallet">{nft.ownerEvm}</p>

                  <p className="cert-label">For a verified donation of</p>
                  <div className="cert-amount">
                    <span className="cert-amount-num">{data.onChain?.amount ?? "—"}</span>
                    <span className="cert-amount-unit">HBAR</span>
                  </div>

                  <p className="cert-label">In support of</p>
                  <p className="cert-ngo">{ngo?.name ?? data.onChain?.ngoId}</p>
                  <p className="cert-cause">“{data.onChain?.cause}”</p>

                  <div className="cert-seal-row">
                    <div className="cert-seal">
                      <div className="cert-seal-inner">
                        <div className="cert-seal-check">✓</div>
                        <div className="cert-seal-text">
                          <span>VERIFIED</span>
                          <span>ON-CHAIN</span>
                        </div>
                      </div>
                    </div>

                    <div className="cert-qr">
                      <img src={nft.qrDataUrl} alt="Scan to trace this donation" />
                      <span className="cert-qr-label">Scan to trace</span>
                    </div>
                  </div>

                  <div className="cert-rule cert-rule-thin" />
                  <div className="cert-foot">
                    <div className="cert-foot-cell">
                      <span className="cert-foot-k">Donation</span>
                      <span className="cert-foot-v mono">{id}</span>
                    </div>
                    <div className="cert-foot-cell">
                      <span className="cert-foot-k">Token</span>
                      <span className="cert-foot-v mono">{nft.tokenId}</span>
                    </div>
                    <div className="cert-foot-cell">
                      <span className="cert-foot-k">Network</span>
                      <span className="cert-foot-v">Hedera Testnet</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="certificate-actions">
                <button
                  onClick={downloadCertificate}
                  disabled={downloading}
                  className="btn ticket-download"
                >
                  {downloading ? (
                    <>
                      <span className="spinner" /> Generating…
                    </>
                  ) : (
                    <>⬇ Download certificate</>
                  )}
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="btn btn-secondary"
                >
                  Hide
                </button>
              </div>
              <p className="ticket-hint">
                Saves as a high-resolution PNG. Shareable, printable, verifiable.
              </p>
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
}