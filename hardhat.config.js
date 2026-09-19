// hardhat.config.js
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function toRawPrivateKey(key) {
  if (!key) return undefined;
  if (key.startsWith("0x") && key.length === 66) return key;

  const ECDSA_PREFIX = "3030020100300706052b8104000a04220420";
  if (key.startsWith(ECDSA_PREFIX)) return "0x" + key.slice(ECDSA_PREFIX.length);

  const ED25519_PREFIX = "302e020100300506032b657004220420";
  if (key.startsWith(ED25519_PREFIX)) {
    throw new Error("EVM_OPERATOR_KEY is Ed25519. Hardhat needs ECDSA.");
  }
  return "0x" + key;
}

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: {
    version: "0.8.34",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    testnet: {
      type: "http",
      url: process.env.HEDERA_RPC_URL,
      accounts: [toRawPrivateKey(process.env.EVM_OPERATOR_KEY)].filter(Boolean),
      chainId: 296,
    },
  },
});