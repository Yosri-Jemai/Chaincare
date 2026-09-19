// lib/hedera/hcs.js
import { TopicId, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { hederaClient } from "./client.js";

const TOPIC_ID = process.env.HCS_TOPIC_ID;

export async function submitHcsEvent(event) {
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(TOPIC_ID))
    .setMessage(JSON.stringify(event))
    .execute(hederaClient);

  const receipt = await tx.getReceipt(hederaClient);
  return {
    txId: tx.transactionId.toString(),
    sequenceNumber: receipt.topicSequenceNumber?.toString(),
  };
}

export async function readHcsEvents(limit = 200) {
  const mirrorUrl = process.env.MIRROR_NODE_URL;
  const messages = [];
  let next = `${mirrorUrl}/api/v1/topics/${TOPIC_ID}/messages?limit=${limit}&order=asc`;

  while (next) {
    const res = await fetch(next, { cache: "no-store" });
    if (!res.ok) throw new Error(`Mirror node error ${res.status}`);
    const data = await res.json();
    messages.push(...(data.messages ?? []));
    next = data.links?.next ? mirrorUrl + data.links.next : null;
    if (messages.length >= limit) break;
  }

  return messages.map((m) => ({
    sequenceNumber: m.sequence_number,
    consensusTimestamp: m.consensus_timestamp,
    ...JSON.parse(Buffer.from(m.message, "base64").toString("utf8")),
  }));
}