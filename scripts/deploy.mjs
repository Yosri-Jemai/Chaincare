// scripts/deploy.mjs
import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { ethers } = await network.getOrCreate();

  const [deployer] = await ethers.getSigners();
  console.log("Deployer (MetaMask):", deployer.address);
  console.log("Balance:            ",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "HBAR");

  const approvers = [deployer.address];
  const feeCollector = process.env.FEE_COLLECTOR_EVM_ADDRESS;
  const platformFeeBps = Number(process.env.PLATFORM_FEE_BPS || 250);

  if (!feeCollector?.startsWith("0x")) {
    throw new Error("FEE_COLLECTOR_EVM_ADDRESS missing or invalid");
  }

  console.log("\n─── Revenue Config ───");
  console.log("Approvers:     ", approvers);
  console.log("Fee collector: ", feeCollector);
  console.log("Platform fee:  ", platformFeeBps / 100 + "%");

  const Factory = await ethers.getContractFactory("DonationEscrow");
  const contract = await Factory.deploy(approvers, feeCollector, platformFeeBps);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ CONTRACT DEPLOYED");
  console.log("CONTRACT_ADDRESS=" + address);
  console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=" + address);
  console.log("HashScan: https://hashscan.io/testnet/contract/" + address);

  const artifactPath = path.join(
    __dirname, "..", "artifacts", "contracts", "DonationEscrow.sol", "DonationEscrow.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const libDir = path.join(__dirname, "..", "lib", "hedera");
  fs.mkdirSync(libDir, { recursive: true });
  fs.writeFileSync(path.join(libDir, "DonationEscrowABI.json"),
    JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(path.join(libDir, "contract-address.json"),
    JSON.stringify({ address }, null, 2));

  console.log("\nSaved ABI  → lib/hedera/DonationEscrowABI.json");
  console.log("Saved addr → lib/hedera/contract-address.json");
}

main().catch((err) => { console.error(err); process.exit(1); });