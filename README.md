# Tempus Engine ⚡

[![CI](https://github.com/JPatronC92/tempus-engine/actions/workflows/main.yml/badge.svg)](https://github.com/JPatronC92/tempus-engine/actions)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange.svg)](https://rust-lang.org)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)

> **Universal Time-Travel Compliance Infrastructure for Pricing**

Tempus is a high-performance, deterministic pricing engine designed for financial compliance and auditability. Calculate fees, commissions, and usage-based pricing with mathematical precision and complete historical traceability.

## 🚀 Why Tempus?

| Feature | Description |
|---------|-------------|
| **Time-Travel Compliance** | Calculate fees as they were on any historical date. Essential for audits and regulatory compliance. |
| **Deterministic Execution** | Same inputs always produce same outputs. Mathematical rules stored as JSON-Logic. |
| **Hybrid Rust/Python** | 1.3M+ TPS via Rust core with Python ergonomics. PyO3 bindings for seamless integration. |
| **Multi-Tenant** | Built-in tenant isolation with API key authentication. Perfect for SaaS platforms. |
| **Immutable Rules** | Rules are append-only with cryptographic hashing. Prove to auditors that historical calculations haven't changed. |

## 📊 Benchmarks

| Operation | Throughput | Latency (p99) |
|-----------|------------|---------------|
| Single Fee Calculation (Rust) | 50,000+ ops/sec | <2ms |
| Batch Processing (100k tx) | 1.3M TPS | <500ms total |
| JSON-Logic Evaluation | 100,000+ rules/sec | <1ms |

*Benchmarked on AMD Ryzen 9 5900X, 32GB RAM*

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              API Layer (FastAPI)              │
├─────────────────────────────────────────────┤
│           Domain (Pricing Engine)           │
│  ┌───────────────────────────────────────┐  │
│  │     Rust Core (tempus_core)          │  │
│  │  • JSON-Logic evaluation           │  │
│  │  • Batch processing                  │  │
│  │  • PyO3 bindings                     │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│     Infrastructure (PostgreSQL + asyncpg)  │
│     • Time-range constraints (btree_gist)    │
│     • Multi-tenant isolation                 │
└─────────────────────────────────────────────┘
```

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
      "currency": "MXN",
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
      "name": "Commission Base 1.5%",
      "amount": 15.00
    }
  ],
  "total_fees": 15.00,
  "net_settlement": 985.00,
  "currency": "MXN",
  "cryptographic_hash": "sha256:abc123..."
}
```

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
    transaction={"amount": 1000, "currency": "MXN"}
)

print(f"Total fees: {result.total_fees}")  # 15.00
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
  transaction: { amount: 1000, currency: "MXN" }
});
```

## 🧪 Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test
uv run pytest tests/test_pricing_engine.py -v
```

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

## 📖 Documentation

- [Architecture Overview](docs/index.md)
- [API Reference](docs/api.md)
- [Python SDK](docs/sdk_python.md)
- [Node.js SDK](docs/sdk_node.md)
- [Benchmarks](docs/benchmarks.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- Report bugs via [GitHub Issues](https://github.com/JPatronC92/tempus-engine/issues)
- Propose features via [GitHub Discussions](https://github.com/JPatronC92/tempus-engine/discussions)
- Join our [Discord](https://discord.gg/tempus-engine) (coming soon)

## 🛡️ Security

For security issues, please email security@tempus-engine.dev or see our [Security Policy](SECURITY.md).

## 📜 License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

**Commercial licensing available**: For proprietary use, white-labeling, or closed-source integration, please contact JPatronC92 on GitHub.

## 🙏 Acknowledgments

- [json-logic](https://jsonlogic.com/) for the rule expression format
- [PyO3](https://pyo3.rs/) for Rust/Python bindings
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [uv](https://docs.astral.sh/uv/) for modern Python packaging

## 📈 Roadmap

- [x] Rust Core with JSON-Logic evaluation
- [x] Batch processing (1M+ TPS)
- [x] Python & Node.js SDKs
- [x] WebAssembly module for browser-side evaluation
- [ ] Stripe Connect integration
- [ ] Usage-based billing (metering service)
- [ ] Multi-region deployment
- [ ] gRPC API
- [ ] GraphQL playground for rule testing

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/JPatronC92">JPatronC92</a>
</p>
