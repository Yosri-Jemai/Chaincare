// lib/hedera/client.js
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);

export const hederaClient = Client.forTestnet().setOperator(operatorId, operatorKey);