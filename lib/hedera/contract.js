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

export async function getDonationOnChain(donationId) {
  const d = await getReadContract().getDonation(donationId);
  return {
    donationId: d.donationId,
    ngoId: d.ngoId,
    cause: d.cause,
    donor: d.donor,
    ngoWallet: d.ngoWallet,
    amount: ethers.formatEther(d.amount),
    released: ethers.formatEther(d.released),
    platformFee: ethers.formatEther(d.platformFee),
    status: Number(d.status),
    createdAt: new Date(Number(d.createdAt) * 1000).toISOString(),
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
      totalReceived: ngo.totalReceived.toString(),
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
    ethers.parseEther(String(amountHbar)),
    reason
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}