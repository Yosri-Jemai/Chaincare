// scripts/register-ngos.mjs
import { network } from "hardhat";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { ethers } = await network.getOrCreate();
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("CONTRACT_ADDRESS missing in .env.local");

  const contract = await ethers.getContractAt("DonationEscrow", address);
  const [operator] = await ethers.getSigners();
  console.log("Operator:", operator.address, "\n");

  const ngos = [
    {
      ngoId: "ngo_alpha",
      name: "Aleppo Winter Relief",
      description: "Food, blankets, and heating fuel for displaced families.",
      wallet: operator.address,
      kycDoc: "kyc_alpha_2026.pdf",
    },
    {
      ngoId: "ngo_beta",
      name: "Gaza Medical Aid",
      description: "Emergency medical supplies and field clinics.",
      wallet: operator.address,
      kycDoc: "kyc_beta_2026.pdf",
    },
    {
      ngoId: "ngo_gamma",
      name: "Sahel Clean Water",
      description: "Borehole drilling and purification in the Sahel.",
      wallet: operator.address,
      kycDoc: "kyc_gamma_2026.pdf",
    },
  ];

  for (const ngo of ngos) {
    const existing = await contract.getNGO(ngo.ngoId);
    if (existing.ngoId && existing.wallet !== ethers.ZeroAddress) {
      console.log(`↷ ${ngo.ngoId} already registered, skipping`);
      continue;
    }
    const kycHash = "0x" + crypto.createHash("sha256").update(ngo.kycDoc).digest("hex");
    const tx = await contract.registerNGO(
      ngo.ngoId, ngo.name, ngo.description, ngo.wallet, kycHash
    );
    await tx.wait();
    console.log(`✅ Registered ${ngo.ngoId} (${ngo.name})`);
    console.log(`   KYC hash: ${kycHash}`);
  }

  console.log("\nTotal NGOs on-chain:", (await contract.getNGOCount()).toString());
}

main().catch((err) => { console.error(err); process.exit(1); });