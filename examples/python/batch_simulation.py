#!/usr/bin/env python3
"""
Batch Simulation Example

This example shows how to simulate fees for a batch of transactions,
useful for P&L forecasting and backtesting.

Scenario:
    You're a CFO considering changing your pricing scheme.
    You want to know: "How much would I have earned if I had
    used different fees last month?"
"""

import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

from tempus import TempusClient


def generate_sample_transactions(count: int = 1000) -> list:
    """Generate realistic transaction data for simulation."""
    transactions = []
    base_date = datetime(2024, 2, 1)  # Simulate February data

    payment_methods = ["credit_card", "debit_card", "spei", "oxxo"]
    currencies = ["MXN", "USD"]

    for i in range(count):
        # Random amount between $50 and $10,000
        amount = round(random.uniform(50, 10000), 2)

        tx = {
            "amount": amount,
            "currency": random.choice(currencies),
            "payment_method": random.choice(payment_methods),
            "timestamp": (base_date + timedelta(hours=i)).isoformat(),
            "merchant_id": f"merch_{random.randint(1, 100)}",
        }
        transactions.append(tx)

    return transactions


def main():
    client = TempusClient(
        api_key=os.getenv("TEMPUS_API_KEY", "demo-key"),
        base_url="http://localhost:8000/api/v1",
    )

    # Generate test transactions
    print("Generating sample transactions...")
    transactions = generate_sample_transactions(1000)

    print(f"Simulating {len(transactions)} transactions...")
    print()

    try:
        result = client.simulate_batch(
            scheme_urn="urn:pricing:marketplace:standard",
            execution_date="2024-02-15",
            transactions=transactions,
        )

        # Display results
        print("=" * 60)
        print("BATCH SIMULATION RESULTS")
        print("=" * 60)
        print(f"Transactions Processed: {result.transactions_count:,}")
        print(f"Failed Transactions:    {result.failed_transactions:,}")
        print(f"Total Volume:          ${result.total_processed_volume:,.2f}")
        print(f"Total Fees Collected:  ${result.total_fees_collected:,.2f}")
        print(f"Net Settlement:        ${result.total_net_settlement:,.2f}")
        print()

        # Calculate metrics
        avg_fee_rate = (
            result.total_fees_collected / result.total_processed_volume * 100
        )
        avg_fee_per_tx = result.total_fees_collected / result.transactions_count

        print("Key Metrics:")
        print(f"  Average Fee Rate:     {avg_fee_rate:.2f}%")
        print(f"  Average Fee per Tx:   ${avg_fee_per_tx:.2f}")
        print(f"  Take Rate:            ${result.total_fees_collected:,.2f}")
        print("=" * 60)

        # Scenario comparison
        print()
        print("SCENARIO COMPARISON:")
        print("-" * 60)
        print("If you change your pricing from 2.5% to 3.0%:")
        current_fees = result.total_fees_collected
        new_fees = result.total_processed_volume * 0.03
        difference = new_fees - current_fees
        print(f"  Current monthly fees: ${current_fees:,.2f}")
        print(f"  New monthly fees:     ${new_fees:,.2f}")
        print(f"  Monthly increase:     ${difference:,.2f} (+{difference/current_fees*100:.1f}%)")
        print(f"  Annualized impact:    ${difference * 12:,.2f}")
        print("=" * 60)

    except Exception as e:
        print(f"Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
