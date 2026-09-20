"use client";
import { useEffect, useState } from "react";
import { useReveal } from "./hooks/useReveal";

const SERVICES = [
  {
    tag: "HCS",
    role: "Consensus Service",
    tone: "hcs",
    title: "The public story",
    body:
      "Every action — received, allocated, spent, distributed — is written as a small, timestamped, tamper-proof message. It powers the live timeline. Nothing can be edited or deleted after the fact.",
  },
  {
    tag: "HSCS",
    role: "Smart Contract Service",
    tone: "hscs",
    title: "The money",
    body:
      "An escrow contract holds every donation and only releases funds when the charity logs a real purchase. It also stores the verified NGO registry on-chain.",
  },
  {
    tag: "HTS",
    role: "Token Service",
    tone: "hts",
    title: "The receipt",
    body:
      "Each donation mints a unique NFT to the donor's wallet. Not a database row, not an email — a token the donor actually owns, with a QR code linking to the live timeline.",
  },
];

const STEPS = [
  { n: "01", title: "A donor gives", body: "Connects their wallet, picks a cause, sends HBAR in one click." },
  { n: "02", title: "Funds are held", body: "A smart contract locks the money in escrow — safe from both sides." },
  { n: "03", title: "The charity logs", body: "They post real updates: purchases, deliveries, impact reports." },
  { n: "04", title: "The donor watches", body: "A live timeline updates in seconds, with blockchain proofs at every step." },
];

export default function Home() {
  const [stats, setStats] = useState({ ngos: 0, donations: 0, volume: 0 });
  const [partners, setPartners] = useState([]);

  useReveal([stats.ngos, partners.length]);

  useEffect(() => {
  fetch("/api/ngos")
    .then((r) => r.json())
    .then(({ ngos }) => {
      setPartners(ngos || []);
      setStats((s) => ({ ...s, ngos: ngos?.length ?? 0 }));
    })
    .catch(() => {});

  fetch("/api/stats")
    .then((r) => r.json())
    .then(({ donations, totalDonated }) => {
      setStats((s) => ({
        ...s,
        donations,
        volume: totalDonated,
      }));
    })
    .catch(() => {});
  }, []);

  return (
    <>
      {/* ─────────────────────────  HERO  ───────────────────────── */}
      <div className="hero">
        <div className="hero-eyebrow reveal">Built on Hedera</div>

        <h1 className="reveal" style={{ transitionDelay: "60ms" }}>
          Watch your <span className="text-gradient">donation</span>
          <br />
          move.
        </h1>

        <p className="reveal" style={{ transitionDelay: "120ms" }}>
          Every step — received, allocated, spent, distributed — recorded as a
          timestamped, tamper-proof event on-chain. Donors see exactly where
          their money goes, live, instead of trusting a year-end PDF.
        </p>

        <div className="hero-cta reveal" style={{ transitionDelay: "180ms" }}>
          <a href="/donate" className="btn">Start a donation →</a>
          <a href="/feed" className="btn btn-secondary">Browse causes</a>
        </div>

        <div className="chain-deco" aria-hidden="true">
          <span className="chain-link" />
          <span className="chain-link" />
          <span className="chain-link" />
          <span className="chain-link" />
          <span className="chain-link" />
        </div>
      </div>

      {/* ─────────────────────────  LIVE STATS  ───────────────────────── */}
      <div className="stats reveal">
        <div className="stat">
          <div className="stat-value">{stats.donations}</div>
          <div className="stat-label">Donations tracked</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.ngos}</div>
          <div className="stat-label">Verified NGOs</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.volume.toFixed(2)}</div>
          <div className="stat-label">HBAR donated</div>
        </div>
        <div className="stat">
          <div className="stat-value">3s</div>
          <div className="stat-label">Finality</div>
        </div>
      </div>

      {/* ─────────────────────────  HOW IT WORKS  ───────────────────────── */}
      <section className="section">
        <div className="section-head reveal">
          <span className="section-eyebrow">How it works</span>
          <h2>From click to delivery, <span className="text-gradient">in public</span></h2>
          <p>Four steps. Every one visible to the donor in real time.</p>
        </div>

        <div className="steps">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="step reveal"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────  SERVICES  ───────────────────────── */}
      <section className="section">
        <div className="section-head reveal">
          <span className="section-eyebrow">Under the hood</span>
          <h2>Three services, <span className="text-gradient">one story</span></h2>
          <p>
            ChainCare uses Hedera&apos;s native services — not a generic blockchain —
            because each one is purpose-built for the job it does here.
          </p>
        </div>

        <div className="services">
          {SERVICES.map((s, i) => (
            <div
              key={s.tag}
              className="service reveal"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <span className={`service-tag ${s.tone}`}>{s.tag}</span>
              <div className="service-role">{s.role}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────  PARTNERS  ───────────────────────── */}
      {partners.length > 0 && (
        <section className="section">
          <div className="section-head reveal">
            <span className="section-eyebrow">On-chain verified</span>
            <h2>Charities <span className="text-gradient">already live</span></h2>
            <p>
              Each one is registered on-chain with a KYC document hash.
              Anyone can verify them without trusting our servers.
            </p>
          </div>

          <div className="partners">
            {partners.slice(0, 6).map((n, i) => (
              <div
                key={n.ngoId}
                className="partner reveal"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="partner-top">
                  <div className="partner-avatar">
                    {n.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{n.name}</h3>
                    <div className="partner-region">Verified · {n.ngoId}</div>
                  </div>
                </div>
                <p>{n.description}</p>
                <div className="partner-verify">
                  KYC {n.kycHash?.slice(0, 14)}…
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────  FEATURES  ───────────────────────── */}
      <section className="section">
        <div className="features">
          <div className="feature reveal">
            <div className="feature-icon">🔐</div>
            <h3>Escrow, not promises</h3>
            <p>
              Funds sit in a smart contract until the charity logs a real purchase.
              Money moves when work moves.
            </p>
          </div>
          <div className="feature reveal" style={{ transitionDelay: "80ms" }}>
            <div className="feature-icon">📡</div>
            <h3>Live, public timeline</h3>
            <p>
              Every action emits a consensus message. Anyone can subscribe and watch
              donations flow in real time.
            </p>
          </div>
          <div className="feature reveal" style={{ transitionDelay: "160ms" }}>
            <div className="feature-icon">🎫</div>
            <h3>On-chain receipt</h3>
            <p>
              Each donation mints a unique NFT with a QR code linking to its live
              tracking page. Proof, not a database row.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────  CTA BAND  ───────────────────────── */}
      <section className="cta-band reveal">
        <h2>
          Don&apos;t trust a report.
          <br />
          <span className="text-gradient">Watch it happen.</span>
        </h2>
        <p>
          Give once. Follow every step. Verify independently.
          That&apos;s what transparency should feel like.
        </p>
        <div className="hero-cta">
          <a href="/donate" className="btn">Start a donation →</a>
          <a href="/donations" className="btn btn-secondary">See live donations</a>
        </div>
      </section>

      {/* ─────────────────────────  FOOTER  ───────────────────────── */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">ChainCare</div>
            <p className="footer-desc">
              Real-time donation transparency, powered by Hedera.
              Every step on-chain, every receipt an NFT, every donor a witness.
            </p>
          </div>

          <div>
            <h4>Product</h4>
            <div className="footer-links">
              <a href="/donate">Donate</a>
              <a href="/feed">Browse causes</a>
              <a href="/donations">All donations</a>
              <a href="/ngo">NGO console</a>
            </div>
          </div>

          <div>
            <h4>Resources</h4>
            <div className="footer-links">
              <a href="https://hashscan.io/testnet" target="_blank" rel="noreferrer">HashScan Explorer</a>
              <a href="https://hedera.com" target="_blank" rel="noreferrer">Hedera</a>
              <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ChainCare. All rights reserved.</span>
          <a
            className="hedera-badge"
            href="https://hashscan.io/testnet"
            target="_blank"
            rel="noreferrer"
          >
            Built on Hedera Testnet
          </a>
        </div>
      </footer>
    </>
  );
}