// lib/hedera/contract.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const ABI = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "lib", "hedera", "DonationEscrowABI.json"),
    "utf8"
  )
);

// Hedera's network minimum gas price is 1.14e12 wei.
// Hashio's eth_gasPrice often returns values below that, so writes fail.
// We hardcode a value slightly above the floor.
const HEDERA_GAS_PRICE = 1_300_000_000_000n; // 1300 gwei

let _provider, _wallet, _readContract, _writeContract;

function getProvider() {
  if (!_provider) _provider = new ethers.JsonRpcProvider(process.env.HEDERA_RPC_URL);
  return _provider;
}

function getWallet() {
  if (!_wallet) {
    const raw = process.env.EVM_OPERATOR_KEY;
    const pk = raw.startsWith("0x") ? raw : "0x" + raw;
    _wallet = new ethers.Wallet(pk, getProvider());
  }
  return _wallet;
}

export function getReadContract() {
  if (!_readContract) {
    _readContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, getProvider());
  }
  return _readContract;
}

export function getWriteContract() {
  if (!_writeContract) {
    _writeContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, getWallet());
  }
  return _writeContract;
}

// Hedera stores HBAR amounts in tinybar (10^8), not wei (10^18).
// Every read/write of an HBAR amount must use 8 decimals.
function toHbar(value) {
  return ethers.formatUnits(value, 8);
}
function fromHbar(value) {
  return ethers.parseUnits(String(value), 8);
}

export async function getDonationOnChain(donationId) {
  const d = await getReadContract().getDonation(donationId);
  return {
    donationId: d.donationId,
    ngoId: d.ngoId,
    cause: d.cause,
    donor: d.donor,
    ngoWallet: d.ngoWallet,
    amount: toHbar(d.amount),
    released: toHbar(d.released),
    platformFee: toHbar(d.platformFee),
    status: Number(d.status),
    createdAt: new Date(Number(d.createdAt) * 1000).toISOString(),
    lastUpdatedAt: new Date(Number(d.lastUpdatedAt) * 1000).toISOString(),
  };
}

export async function getAllNGOs() {
  const contract = getReadContract();
  const count = Number(await contract.getNGOCount());
  const out = [];
  for (let i = 0; i < count; i++) {
    const id = await contract.getNGOIdAt(i);
    const ngo = await contract.getNGO(id);
    if (!ngo.active) continue;
    out.push({
      ngoId: ngo.ngoId,
      name: ngo.name,
      description: ngo.description,
      wallet: ngo.wallet,
      kycHash: ngo.kycHash,
      totalReceived: toHbar(ngo.totalReceived),
    });
  }
  return out;
}

export async function getPlatformFeeInfo() {
  const contract = getReadContract();
  const bps = Number(await contract.platformFeeBps());
  const collector = await contract.feeCollector();
  return { bps, percent: bps / 100, collector };
}

export async function releaseFundsOnChain({ donationId, amountHbar, reason }) {
  const tx = await getWriteContract().releaseFunds(
    donationId,
    fromHbar(amountHbar),
    reason,
    { gasPrice: HEDERA_GAS_PRICE }
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}