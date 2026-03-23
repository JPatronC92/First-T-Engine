# Tempus Engine ⚡

[![CI](https://github.com/JPatronC92/tempus-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/JPatronC92/tempus-engine/actions)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange.svg)](https://rust-lang.org)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![Demo](https://img.shields.io/badge/Demo-Live-success)](https://first-t-engine.vercel.app/)

> **Universal Time-Travel Compliance Infrastructure for Pricing**

Tempus is a high-performance, deterministic pricing engine designed for financial compliance and auditability. Calculate fees, commissions, and usage-based pricing with mathematical precision and complete historical traceability.

**[🚀 Live Demo](https://first-t-engine.vercel.app/)** | **[📖 Documentation](docs/)** | **[💬 Discussions](https://github.com/JPatronC92/tempus-engine/discussions)**

---

## 🚀 Why Tempus?

| Feature | Description |
|---------|-------------|
| **Time-Travel Compliance** | Calculate fees as they were on any historical date. Essential for audits and regulatory compliance across jurisdictions. |
| **Deterministic Execution** | Same inputs always produce same outputs. Mathematical rules stored as immutable JSON-Logic. |
| **Hybrid Rust/Python** | 1.3M+ TPS via Rust core with Python ergonomics. PyO3 bindings for seamless integration. |
| **Multi-Tenant** | Built-in tenant isolation with API key authentication. Perfect for SaaS platforms serving global customers. |
| **Immutable Rules** | Rules are append-only with cryptographic hashing. Prove to auditors that historical calculations haven't changed. |
| **Universal Application** | Supports any currency, any pricing model, any jurisdiction. From payment processing to enterprise SaaS. |

---

## 📊 Benchmarks

| Operation | Throughput | Latency (p99) |
|-----------|------------|---------------|
| Single Fee Calculation (Rust) | 50,000+ ops/sec | <2ms |
| Batch Processing (100k tx) | 1.3M TPS | <500ms total |
| JSON-Logic Evaluation | 100,000+ rules/sec | <1ms |

*Benchmarked on AMD Ryzen 9 5900X, 32GB RAM*

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                   │
│  • OpenAPI documentation  • JWT authentication           │
│  • Multi-tenant routing     • Rate limiting                │
├─────────────────────────────────────────────────────────┤
│              Domain (Pricing Engine)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Rust Core (tempus_core)               │   │
│  │  • JSON-Logic evaluation (jsonlogic-rs)         │   │
│  │  • Parallel batch processing (rayon)           │   │
│  │  • PyO3 bindings for Python integration          │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│     Infrastructure (PostgreSQL 16+ + asyncpg)            │
│  • Time-range exclusion constraints (btree_gist)       │
│  • Multi-tenant row-level security                       │
│  • Async connection pooling                              │
├─────────────────────────────────────────────────────────┤
│                    SDKs & Clients                       │
│  • Python SDK (httpx + Pydantic)                        │
│  • Node.js SDK (axios + TypeScript)                     │
│  • WebAssembly (browser-side evaluation)                │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Rust 1.75+
- PostgreSQL 16+ with `btree_gist` extension
- [uv](https://docs.astral.sh/uv/) (modern Python package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/JPatronC92/tempus-engine.git
cd tempus-engine

# Install dependencies
uv sync

# Build the Rust extension
cd tempus_core && maturin develop --release && cd ..

# Set up database
docker compose up db -d
docker exec tempus-db psql -U postgres -d tempus_db -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"

# Run migrations
cp .env.example .env
alembic upgrade head

# Seed sample data
uv run python scripts/seed.py

# Start the API
uv run uvicorn src.interfaces.api.main:app --reload
```

### Your First Calculation

```bash
# Create a tenant and get API key
# (See seed.py for sample data)

# Calculate a fee
curl -X POST http://localhost:8000/api/v1/billing/calculate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "scheme_urn": "urn:pricing:marketplace:standard",
    "execution_date": "2024-03-22T10:00:00",
    "transaction": {
      "amount": 1000.00,
      "currency": "USD",
      "payment_method": "credit_card"
    }
  }'
```

**Response:**
```json
{
  "base_amount": 1000.00,
  "calculated_fees": [
    {
      "rule_id": "uuid-rule-123",
      "name": "Processing Fee 2.9%",
      "amount": 29.00
    },
    {
      "rule_id": "uuid-rule-124",
      "name": "Fixed Fee",
      "amount": 0.30
    }
  ],
  "total_fees": 29.30,
  "net_settlement": 970.70,
  "currency": "USD",
  "cryptographic_hash": "sha256:abc123..."
}
```

---

## 🎯 Use Cases

### Payment Gateways
Calculate processing fees for credit cards, bank transfers, and digital wallets. Support for risk-based pricing and international transfers.

**Supported Methods:**
- Credit/Debit cards (Visa, Mastercard, Amex)
- Bank transfers (ACH, SEPA, Wire)
- Digital wallets (Apple Pay, Google Pay)
- Buy Now Pay Later (installments)

### SaaS Usage-Based Billing
Metered pricing for API calls, storage, compute hours. Tiered discounts based on volume.

**Features:**
- Progressive tier pricing
- Volume discounts
- Commitment-based discounts
- Usage alerts and thresholds

### Financial Services
Cross-border transfers, FX conversions, and compliance fees. Time-travel queries for audit trails.

**Capabilities:**
- Multi-currency support
- FX spread calculations
- Compliance screening fees
- Tax withholding calculations

### Enterprise Volume Pricing
Seat-based licensing with volume commitments. Add-ons for support, SLA guarantees, and training.

---

## 📚 SDKs

### Python SDK

```python
from tempus import TempusClient

client = TempusClient(
    api_key="your-api-key",
    base_url="http://localhost:8000/api/v1"
)

result = client.calculate(
    scheme_urn="urn:pricing:marketplace:standard",
    execution_date="2024-03-22",
    transaction={"amount": 1000, "currency": "USD", "payment_method": "credit_card"}
)

print(f"Total fees: {result.total_fees}")  # 29.30
print(f"Audit hash: {result.cryptographic_hash}")
```

### Node.js SDK

```typescript
import { TempusClient } from "tempus-node";

const client = new TempusClient({
  apiKey: "your-api-key",
  baseURL: "http://localhost:8000/api/v1"
});

const result = await client.calculate({
  scheme_urn: "urn:pricing:marketplace:standard",
  execution_date: new Date(),
  transaction: { amount: 1000, currency: "USD", payment_method: "credit_card" }
});

console.log(`Total fees: ${result.total_fees}`);
console.log(`Audit hash: ${result.cryptographic_hash}`);
```

---

## 🧪 Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test
uv run pytest tests/test_pricing_engine.py -v
```

---

## 🐳 Docker Deployment

```bash
# Production deployment
docker compose up --build

# Or use the pre-built image
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=your-secret \
  tempus-engine:latest
```

---

## 📖 Documentation

- [Architecture Overview](docs/index.md)
- [API Reference](docs/api.md)
- [Python SDK](docs/sdk_python.md)
- [Node.js SDK](docs/sdk_node.md)
- [Benchmarks](docs/benchmarks.md)
- [Deployment Guide](docs/deployment.md)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- Report bugs via [GitHub Issues](https://github.com/JPatronC92/tempus-engine/issues)
- Propose features via [GitHub Discussions](https://github.com/JPatronC92/tempus-engine/discussions)

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/tempus-engine.git
cd tempus-engine

# Install dev dependencies
uv sync

# Build Rust extension
cd tempus_core && maturin develop --release

# Run tests
uv run pytest
```

---

## 🛡️ Security

For security issues, please see our [Security Policy](SECURITY.md).

- API key authentication with per-tenant isolation
- JWT with configurable expiration
- PostgreSQL row-level security
- Immutable audit trails with SHA-256 hashing

---

## 📜 License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

**Commercial licensing available**: For proprietary use, white-labeling, or closed-source integration, please contact JPatronC92 on GitHub.

---

## 🙏 Acknowledgments

- [json-logic](https://jsonlogic.com/) for the rule expression format
- [PyO3](https://pyo3.rs/) for Rust/Python bindings
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [uv](https://docs.astral.sh/uv/) for modern Python packaging
- [jsonlogic-rs](https://github.com/johnnywell/jsonlogic-rs) for Rust JSON-Logic implementation

---

## 📈 Roadmap

- [x] Rust Core with JSON-Logic evaluation
- [x] Batch processing (1M+ TPS)
- [x] Python & Node.js SDKs
- [x] WebAssembly module for browser-side evaluation
- [x] Interactive demo with live calculations
- [ ] GraphQL API
- [ ] Built-in rule templates library
- [ ] Real-time usage metering service
- [ ] Multi-region deployment support
- [ ] Advanced analytics dashboard

---

<p align="center">
  <strong>Built with ⚡ by <a href="https://github.com/JPatronC92">JPatronC92</a></strong>
</p>

<p align="center">
  <a href="https://first-t-engine.vercel.app/">🚀 Try the Demo</a> •
  <a href="https://github.com/JPatronC92/tempus-engine">⭐ Star on GitHub</a> •
  <a href="https://github.com/JPatronC92/tempus-engine/discussions">💬 Join Discussions</a>
</p>
