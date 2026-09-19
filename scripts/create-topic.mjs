// scripts/create-topic.mjs
import {
  Client, TopicCreateTransaction, PrivateKey, AccountId,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const client = Client.forTestnet().setOperator(
    AccountId.fromString(process.env.HEDERA_OPERATOR_ID),
    PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY)
  );

  const tx = await new TopicCreateTransaction()
    .setTopicMemo("TrustGive — production donation transparency log")
    .execute(client);

  const receipt = await tx.getReceipt(client);
  console.log("\n TOPIC CREATED");
  console.log("HCS_TOPIC_ID=" + receipt.topicId.toString());
  console.log("HashScan: https://hashscan.io/testnet/topic/" + receipt.topicId.toString());
  client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });