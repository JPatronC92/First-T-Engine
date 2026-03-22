# Examples

This directory contains example use cases and integrations for Tempus Engine.

## Available Examples

### Python Examples

- [`simple_calculation.py`](python/simple_calculation.py) - Basic fee calculation
- [`batch_simulation.py`](python/batch_simulation.py) - Batch processing for P&L
- [`custom_rules.py`](python/custom_rules.py) - Creating custom JSON-Logic rules

### Node.js Examples

- [`basic_usage.ts`](nodejs/basic_usage.ts) - SDK basic usage
- [`webhook_handler.ts`](nodejs/webhook_handler.ts) - Processing webhooks

### Integration Examples

- [`stripe_integration/`](stripe_integration/) - Using Tempus with Stripe
- [`usage_based_billing/`](usage_based_billing/) - Metering and usage billing

## Running Examples

### Python

```bash
cd examples/python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python simple_calculation.py
```

### Node.js

```bash
cd examples/nodejs
npm install
npx ts-node basic_usage.ts
```

## Need More?

- Check the [Documentation](../docs/)
- Read the [API Reference](../docs/api.md)
- Join our [Discord](https://discord.gg/tempus-engine) (coming soon)
