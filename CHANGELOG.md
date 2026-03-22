# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial open source release preparation
- AGPL v3 license
- Contributing guidelines
- Security policy
- Code of conduct

## [0.1.0] - 2024-03-11

### Added
- **Rust Core Engine** (`tempus_core`)
  - JSON-Logic evaluation engine
  - Batch processing with 1.3M+ TPS
  - PyO3 bindings for Python integration
  - Rayon parallelization support

- **Python API** (FastAPI)
  - REST API with OpenAPI documentation
  - Multi-tenant architecture with API key authentication
  - Time-travel pricing queries (historical rule evaluation)
  - JWT authentication for dashboard
  - PostgreSQL + asyncpg integration
  - Alembic migrations

- **Domain Models**
  - Tenant isolation
  - PricingScheme with URN identifiers
  - PricingRuleIdentity (immutable rule definitions)
  - PricingRuleVersion (time-bounded with DATERANGE)
  - PricingContextSchema (JSON Schema validation)
  - Cryptographic hashing for audit trails

- **Pricing Engine**
  - Single transaction fee calculation
  - Batch simulation for P&L forecasting
  - JSON-Logic rule evaluation
  - Schema validation via Draft7Validator
  - Dual-path: Rust (fast) + Python (fallback)

- **SDKs**
  - Python SDK (`tempus-python`) with httpx
  - Node.js SDK (`tempus-node`) with axios
  - Type definitions and Pydantic models

- **Frontend Dashboard** (`tempus-dashboard`)
  - Next.js 16 with React 19
  - Real-time P&L visualization
  - Recharts integration
  - Vercel deployment ready

- **WebAssembly Module** (`tempus_wasm`)
  - Browser-side JSON-Logic evaluation
  - wasm-bindgen bindings

- **Infrastructure**
  - Docker Compose setup
  - Multi-stage Dockerfile
  - GitHub Actions CI/CD
  - Benchmark suite

### Security
- API key authentication with per-tenant isolation
- JWT with configurable expiration
- PostgreSQL `btree_gist` extension for temporal constraints
- Immutable rule versioning (updates blocked at DB level)
- SHA-256 cryptographic hashing for audit trails

[Unreleased]: https://github.com/JPatronC92/tempus-engine/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/JPatronC92/tempus-engine/releases/tag/v0.1.0
