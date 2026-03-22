# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Tempus Engine, please report it responsibly:

**Please do NOT disclose security issues publicly via GitHub issues.**

Instead, report via:

1. **Email**: security@tempus-engine.dev (preferred)
2. **GitHub Security Advisories**: Use the "Report a vulnerability" feature on our repository

## What to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: What could an attacker do?
- **Reproduction steps**: How to trigger the vulnerability
- **Environment**: Version, OS, configuration
- **Possible fix**: If you have suggestions

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix timeline**: Based on severity
  - Critical: 7 days
  - High: 30 days
  - Medium: 90 days

## Security Best Practices

When deploying Tempus Engine:

### API Keys
- Store API keys securely (use secret managers)
- Rotate keys regularly
- Never commit keys to version control

### Database
- Use strong PostgreSQL passwords
- Enable SSL/TLS for database connections
- Regular backups with encryption

### Network
- Run behind a reverse proxy (nginx/traefik)
- Use HTTPS in production
- Implement rate limiting

### Secrets
```bash
# Never do this:
SECRET_KEY="hardcoded-secret"

# Do this instead:
SECRET_KEY=$(openssl rand -hex 32)
# Store in environment or secret manager
```

## Security Features

Tempus Engine implements:

- **API Key authentication** with per-tenant isolation
- **Cryptographic hashing** of pricing rules (SHA-256)
- **Immutable audit trail** via PostgreSQL constraints
- **Input validation** via JSON Schema
- **Time-range constraints** preventing overlapping rule versions

## Third-Party Dependencies

We monitor dependencies for security vulnerabilities:

```bash
# Check for known vulnerabilities
uv run pip-audit

# In Rust
cd tempus_core && cargo audit
```

## Hall of Fame

We thank the following security researchers who have responsibly disclosed vulnerabilities:

*None yet - be the first!*

---

Thank you for helping keep Tempus Engine secure!
