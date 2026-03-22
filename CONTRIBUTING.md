# Contributing to Tempus Engine

First off, thank you for considering contributing to Tempus Engine! It's people like you that make this project a great tool for the community.

## Code of Conduct

This project and everyone participating in it is governed by our code of conduct: be respectful, be constructive, and help others learn.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, please include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior vs actual behavior**
- **Environment details**: OS, Python version, Rust version, PostgreSQL version
- **Logs or error messages**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Please provide:

- **Clear use case**: What problem does this solve?
- **Detailed description**: How would it work?
- **Alternatives considered**: What else did you try?

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `uv run pytest`
5. Format code: `uv run black src tests && uv run isort src tests`
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

### Prerequisites

- Python 3.12+
- Rust 1.75+
- PostgreSQL 16+
- [uv](https://docs.astral.sh/uv/)
- [maturin](https://www.maturin.rs/) (for Rust builds)

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/tempus-engine.git
cd tempus-engine

# Install dependencies
uv sync

# Build Rust extension
cd tempus_core
maturin develop --release
cd ..

# Set up database
docker compose up db -d
alembic upgrade head

# Run tests
uv run pytest

# Start development server
uv run uvicorn src.interfaces.api.main:app --reload
```

## Project Structure

```
tempus-engine/
├── tempus_core/          # Rust core (JSON-Logic engine)
├── src/                  # Python FastAPI application
│   ├── core/            # Config, security, utilities
│   ├── domain/          # Business logic and models
│   ├── infrastructure/  # Database and repositories
│   └── interfaces/      # API routers and dependencies
├── tempus-python/        # Python SDK
├── tempus-node/          # Node.js SDK
├── tempus_wasm/          # WebAssembly module
├── tests/                # Test suite
└── docs/                 # Documentation
```

## Coding Standards

### Python

- Follow PEP 8
- Use type hints
- Maximum line length: 88 (Black default)
- Format with Black, sort imports with isort

```bash
uv run black src tests
uv run isort src tests
uv run ruff check src tests
```

### Rust

- Follow Rust naming conventions
- Use `cargo fmt` and `cargo clippy`
- Document public APIs with rustdoc

```bash
cd tempus_core
cargo fmt
cargo clippy -- -D warnings
cargo doc
```

### Commit Messages

- Use present tense: "Add feature" not "Added feature"
- Use imperative mood: "Move cursor to..." not "Moves cursor to..."
- Reference issues: "Fixes #123"

## Testing

All contributions should include tests:

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test
uv run pytest tests/test_pricing_engine.py::test_calculate_fee -v
```

### Writing Tests

- Use pytest fixtures for database setup
- Test both Rust and Python paths
- Include edge cases and error conditions
- For batch operations, test with realistic data sizes

## Documentation

- Update README.md if adding features
- Add docstrings to new functions/classes
- Update relevant files in `docs/`
- Add examples for new features

## Performance Considerations

When contributing performance-critical code:

1. Include benchmarks in `benchmarks/`
2. Compare against baseline: `cargo bench` or `python benchmarks/benchmark_engine.py`
3. Document performance characteristics

## Security

- Never commit secrets or credentials
- Report security issues privately (see SECURITY.md)
- Follow OWASP guidelines for web security

## Questions?

Feel free to:
- Open an issue for questions
- Join our Discord (coming soon)
- Email: tempus-engine@example.com

Thank you for contributing! 🎉
