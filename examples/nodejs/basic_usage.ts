/**
 * Basic Usage Example - Node.js
 *
 * Shows how to calculate fees using the Tempus Node.js SDK
 */

import { TempusClient } from "tempus-node";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Initialize client
  const client = new TempusClient({
    apiKey: process.env.TEMPUS_API_KEY || "demo-key",
    baseURL: process.env.TEMPUS_BASE_URL || "http://localhost:8000/api/v1",
  });

  // Transaction data
  const transaction = {
    amount: 1500.0,
    currency: "MXN",
    payment_method: "credit_card",
    card_brand: "mastercard",
    installments: 6,
    merchant_id: "merch_67890",
  };

  try {
    // Calculate fees
    const result = await client.calculate({
      scheme_urn: "urn:pricing:marketplace:standard",
      execution_date: new Date(),
      transaction,
    });

    // Display results
    console.log("=".repeat(50));
    console.log("FEE CALCULATION RESULT");
    console.log("=".repeat(50));
    console.log(`Base Amount: $${result.base_amount.toFixed(2)} ${result.currency}`);
    console.log(`Total Fees:  $${result.total_fees.toFixed(2)}`);
    console.log(`Net Settlement: $${result.net_settlement.toFixed(2)}`);
    console.log(
      `Effective Rate: ${((result.total_fees / result.base_amount) * 100).toFixed(2)}%`
    );
    console.log();
    console.log("Fee Breakdown:");
    result.calculated_fees.forEach((fee: any) => {
      console.log(`  - ${fee.name}: $${fee.amount.toFixed(2)}`);
    });
    console.log();
    console.log(`Audit Hash: ${result.cryptographic_hash}`);
    console.log("=".repeat(50));
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
