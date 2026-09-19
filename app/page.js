export default function Home() {
  return (
    <div className="hero">
      <h1>
        Watch your <span className="text-gradient">donation</span> move.
      </h1>
      <p>
        Every step — received, spent, distributed — is a tamper-proof event on
        Hedera. Scan a QR, watch it happen live. No more year-end reports.
      </p>

      <div className="hero-cta">
        <a href="/donate" className="btn">Donate now →</a>
        <a href="/feed" className="btn btn-secondary">Browse causes</a>
      </div>

      <div className="features">
        <div className="feature">
          <span className="feature-icon">🔗</span>
          <h3>On-chain escrow</h3>
          <p>Funds held in a smart contract, released only when the NGO logs progress.</p>
        </div>
        <div className="feature">
          <span className="feature-icon">📡</span>
          <h3>Live timeline</h3>
          <p>Every action emits a consensus message. Poll the feed, watch it stream in.</p>
        </div>
        <div className="feature">
          <span className="feature-icon">🎫</span>
          <h3>NFT receipts</h3>
          <p>Get a personal proof of impact — verifiable forever, not a database row.</p>
        </div>
      </div>
    </div>
  );
}