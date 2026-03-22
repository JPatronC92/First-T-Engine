#!/usr/bin/env python3
"""
Simple Fee Calculation Example

This example shows how to calculate fees for a single transaction
using the Tempus Python SDK.

Prerequisites:
    1. Tempus API running (uvicorn src.interfaces.api.main:app)
    2. Valid API key (see scripts/seed.py to create one)
    3. Pricing scheme configured

Environment:
    Set TEMPUS_API_KEY environment variable or create .env file
"""

import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from tempus import TempusClient, TempusError


def main():
    # Initialize client
    client = TempusClient(
        api_key=os.getenv("TEMPUS_API_KEY", "demo-key"),
        base_url="http://localhost:8000/api/v1",
    )

    # Transaction data
    transaction = {
        "amount": 1000.00,
        "currency": "MXN",
        "payment_method": "credit_card",
        "card_brand": "visa",
        "installments": 3,
        "merchant_id": "merch_12345",
    }

    try:
        # Calculate fees
        result = client.calculate(
            scheme_urn="urn:pricing:marketplace:standard",
            execution_date=datetime.now().isoformat(),
            transaction=transaction,
        )

        # Display results
        print("=" * 50)
        print("FEE CALCULATION RESULT")
        print("=" * 50)
        print(f"Base Amount: ${result.base_amount:,.2f} {result.currency}")
        print(f"Total Fees:  ${result.total_fees:,.2f}")
        print(f"Net Settlement: ${result.net_settlement:,.2f}")
        print(f"Effective Rate: {(result.total_fees / result.base_amount * 100):.2f}%")
        print()
        print("Fee Breakdown:")
        for fee in result.calculated_fees:
            print(f"  - {fee.name}: ${fee.amount:,.2f}")
        print()
        print(f"Audit Hash: {result.cryptographic_hash}")
        print("=" * 50)

    except TempusError as e:
        print(f"Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
