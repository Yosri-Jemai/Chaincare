"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import DonationEscrowABI from "@/lib/hedera/DonationEscrowABI.json";

const QUICK_AMOUNTS = [1, 5, 10, 25];

export default function DonatePage() {
  const [account, setAccount] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [feeInfo, setFeeInfo] = useState(null);
  const [ngoId, setNgoId] = useState("");
  const [amount, setAmount] = useState(5);
  const [cause, setCause] = useState("");
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState("info");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ngos")
      .then((r) => r.json())
      .then(({ ngos, feeInfo }) => { setNgos(ngos); setFeeInfo(feeInfo); })
      .catch((e) => {
        setStatus("Failed to load NGOs: " + e.message);
        setStatusKind("error");
      })
      .finally(() => setLoading(false));
  }, []);

  async function connect() {
    if (!window.ethereum) { setStatus("Install MetaMask."); setStatusKind("error"); return; }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  }

  async function donate(e) {
    e.preventDefault();
    setBusy(true);
    setStatusKind("info");
    try {
      if (!window.ethereum) throw new Error("MetaMask not found");
      setStatus("Connecting wallet…");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const donorAddress = accounts[0];
      setAccount(donorAddress);

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        DonationEscrowABI,
        signer
      );

      const donationId = "don_" + crypto.randomUUID().slice(0, 8);

      setStatus("Waiting for wallet signature…");
      const tx = await contract.donate(donationId, ngoId, cause, {
      value: ethers.parseEther(String(amount)),
      });

      setStatus("Submitted. Waiting for consensus…");
      const receipt = await tx.wait();

      setStatus("Logging to HCS and minting receipt NFT…");
      const res = await fetch("/api/donate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId, ngoId, cause, amount, donorAddress, txHash: receipt.hash,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStatusKind("success");
      setStatus("Done. Redirecting to your tracking page…");
      window.location.href = data.trackingUrl;
    } catch (err) {
      setStatus("Error: " + (err.message || String(err)));
      setStatusKind("error");
      setBusy(false);
    }
  }

  const fee = feeInfo ? (amount * feeInfo.percent) / 100 : 0;
  const selected = ngos.find((n) => n.ngoId === ngoId);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Donate</h1>
        </div>
        <div className="card">
          <div className="skeleton" style={{ width: "40%" }} />
          <div className="skeleton" style={{ width: "80%" }} />
          <div className="skeleton" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Donate</h1>
        <p>Choose a cause. Every donation is escrowed and tracked on-chain.</p>
      </div>

      {!account ? (
        <button onClick={connect} className="btn" style={{ marginBottom: "1.5rem" }}>
          Connect MetaMask
        </button>
      ) : (
        <div className="card" style={{ padding: "0.75rem 1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="badge badge-live">Connected</span>
          <span className="mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {account.slice(0, 6)}…{account.slice(-4)}
          </span>
        </div>
      )}

      <form onSubmit={donate}>
        {/* NGO selection */}
        <div className="field">
          <label>Choose a cause</label>
          <div className="ngo-grid">
            {ngos.map((n) => (
              <div
                key={n.ngoId}
                className={`ngo-card ${ngoId === n.ngoId ? "selected" : ""}`}
                onClick={() => setNgoId(n.ngoId)}
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
              </div>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="field" style={{ marginTop: "1.5rem" }}>
          <label>Amount</label>
          <div className="amount-group">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                type="button"
                className={`amount-btn ${amount === v ? "active" : ""}`}
                onClick={() => setAmount(v)}
              >
                {v} HBAR
              </button>
            ))}
          </div>
          <div className="amount-input-wrap">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <span className="suffix">HBAR</span>
          </div>
        </div>

        {/* Cause note */}
        <div className="field">
          <label>Campaign note</label>
          <input
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            placeholder="e.g. Winter relief 2026"
            required
          />
        </div>

        {/* Fee breakdown */}
        {feeInfo && (
          <div className="fee-box">
            <div className="row">
              <span>Platform fee · {feeInfo.percent}%</span>
              <span>{fee.toFixed(4)} HBAR</span>
            </div>
            <div className="row">
              <span>Network gas (paid by you)</span>
              <span>~0.001 HBAR</span>
            </div>
            <div className="row total">
              <span>NGO receives</span>
              <span>{(amount - fee).toFixed(4)} HBAR</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-full"
          disabled={busy || !ngoId}
        >
          {busy ? (
            <>
              <span className="spinner" />
              Processing…
            </>
          ) : (
            <>Donate {amount} HBAR →</>
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