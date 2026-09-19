// scripts/create-nft-collection.mjs
import {
  Client, TokenCreateTransaction, TokenType, TokenSupplyType,
  PrivateKey, AccountId,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  const tx = await new TokenCreateTransaction()
    .setTokenName("TrustGive Donation Receipts")
    .setTokenSymbol("TGR")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(operatorId)
    .setSupplyKey(operatorKey)
    .setAdminKey(operatorKey)
    .setTokenMemo("Verifiable donation receipts on Hedera")
    .freezeWith(client)
    .sign(operatorKey);

  const receipt = await (await tx.execute(client)).getReceipt(client);
  console.log("\n NFT COLLECTION CREATED");
  console.log("HTS_NFT_TOKEN_ID=" + receipt.tokenId.toString());
  console.log("HashScan: https://hashscan.io/testnet/token/" + receipt.tokenId.toString());
  client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });