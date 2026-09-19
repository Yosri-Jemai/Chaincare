// lib/wallet/hederaWallet.js
"use client";

import { DAppConnector, HederaJsonRpcMethod } from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";

let dAppConnector = null;

export async function initWallet() {
  if (dAppConnector) return dAppConnector;
  dAppConnector = new DAppConnector(
    {
      name: "TrustGive",
      description: "Real-time donation transparency on Hedera",
      url: process.env.NEXT_PUBLIC_BASE_URL,
      icons: ["https://hashscan.io/favicon.ico"],
    },
    LedgerId.TESTNET,
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    Object.values(HederaJsonRpcMethod),
  );
  await dAppConnector.init({ logger: "error" });
  return dAppConnector;
}

export async function connectWallet() {
  const c = await initWallet();
  await c.connect();
  return c.signers[0]?.getAccountId()?.toString() ?? null;
}

export async function getConnectedAccount() {
  const c = await initWallet();
  return c.signers[0]?.getAccountId()?.toString() ?? null;
}