<div align="center">

# ChainCare

### Real-time donation transparency, powered by Hedera

*Every step of a donation — received, spent, distributed — logged on-chain.
Donors watch their money move, live.*

[![Hedera](https://img.shields.io/badge/Hedera-Testnet-4B0082?style=flat-square)](https://hedera.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Hardhat](https://img.shields.io/badge/Hardhat-3-yellow?style=flat-square)](https://hardhat.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## The Problem

When you donate to a charity, you hand over your money and lose sight of it. There's no way to know if it reached the cause, was eaten by overhead, or moved at all. You're asked to **trust** — never shown **proof**.

## The Solution

**ChainCare makes every step of a donation public and verifiable.**

When someone donates, the money doesn't go straight to the charity. It goes into a smart contract that holds it until the charity logs what they actually spent it on. Every action — the donation, the spending, the delivery — is written to a permanent public record that anyone can check in real time.

The donor gets a digital receipt (an NFT) with a QR code that opens a live page showing exactly where their money is.

---

## How It Works

1. **A donor gives** — connects their wallet, picks a cause, sends HBAR
2. **The money is held in escrow** — a smart contract locks it, safe from both sides
3. **The charity logs spending** — they post updates like *"Bought 100 blankets, 4 HBAR"*
4. **Funds are released** — only when a real purchase is logged does money move
5. **The donor watches** — a live timeline updates in seconds, with links to verify on the blockchain

No year-end PDF. No "trust us" branding. Just a public feed of what actually happened.

---

## Built on Hedera

ChainCare uses three of Hedera's core services — each one doing a specific job:

### HCS — Hedera Consensus Service → *the public story*

Every action in a donation's life — received, allocated, spent, distributed, refunded —
is written here as a small, timestamped, immutable message.

This is what powers the live timeline. Because HCS is a consensus log, events cannot be
reordered, edited, or deleted after the fact. Anyone can subscribe to the topic and watch
donations flow in real time. It is the transparency layer of the entire product.

### HSCS — Hedera Smart Contract Service → *the money*

The escrow contract lives here. When a donor gives HBAR, the funds go into this contract —
not to the charity's wallet. The contract splits the platform fee, holds the rest in escrow,
and only releases money when a charity logs a real purchase.

It also stores the verified NGO registry: each charity's name, wallet address, and a KYC
document hash — permanently on-chain.

### HTS — Hedera Token Service → *the receipt*

For every donation, ChainCare mints a unique NFT and sends it to the donor's wallet. This
NFT is a cryptographic proof of contribution — not a database row, not an email, but a token
the donor actually owns. It carries a short pointer (via its metadata) to the donation's
tracking page, so scanning the QR code on the receipt opens the live timeline.

### Why this split works

Three services, three responsibilities, one orchestrator. The backend calls each service
independently — nothing calls another service on-chain. This keeps each integration simple
to test, debug, and reason about, while still delivering the full transparency story:

- **HCS** answers *"what happened?"*
- **HSCS** answers *"where is the money right now?"*
- **HTS** answers *"what proof does the donor have?"*

## What Makes It Different

| Typical donation platform | ChainCare |
|---|---|
| Year-end PDF report | Live, auto-updating timeline |
| "We promise" branding | Cryptographic proof on a public explorer |
| Funds sent directly to the charity | Held in escrow until spent |
| A generic thank-you email | An NFT receipt with a QR code |

---

## The Stack

- **Frontend** — Next.js 16, React
- **Backend** — Next.js API routes
- **Smart Contract** — Solidity + Hardhat
- **Hedera SDK** — `@hashgraph/sdk` for consensus and token operations
- **Wallet** — MetaMask
- **No database** — everything is reconstructed from on-chain data

---

## Project Structure

```
chain-care/
├── app/                # Next.js pages + API routes
│   ├── donate/         # Donor form
│   ├── track/[id]/     # Live donation timeline
│   ├── feed/           # NGO directory
│   ├── ngo/            # NGO control panel
│   └── api/            # Backend endpoints
├── contracts/          # Solidity smart contract
├── scripts/            # One-time setup + deployment
├── lib/                # Hedera + contract helpers
└── hardhat.config.js
```

---

## Pages

| Page | What it does |
|---|---|
| **Home** | Explains the product in 10 seconds |
| **Donate** | Donor fills a form, connects MetaMask, sends HBAR |
| **Track** | Live timeline of one donation, with NFT ticket and QR code |
| **Feed** | Public list of verified charities with their on-chain credentials |
| **NGO Console** | Charities log progress here; spending releases funds from escrow |
| **Donations** | Index of every donation ever made |

---

## How a Donation Flows

```
Donor → Smart Contract → Fee (2.5%) to platform
                       → Remainder held in escrow

Charity logs "Funds used" → Contract releases that amount to the charity
                          → Event written to the public log
                          → Donor sees it on their tracking page in seconds
```

Every step is verifiable through Hedera's public blockchain explorer — no reliance on the app's own servers.

---

<div align="center">

**ChainCare** — *Give on-chain. Watch it land.*

</div>