# JSON-Logic Rule Examples

This directory contains example pricing rules using JSON-Logic format.

## What is JSON-Logic?

JSON-Logic is a way to write rules that can be executed consistently across platforms.
Rules are JSON objects that describe logical operations.

Documentation: https://jsonlogic.com/

## Basic Examples

### Fixed Percentage Fee (2.5%)

```json
{
  "*": [
    { "var": "amount" },
    0.025
  ]
}
```

### Fixed Fee + Percentage

```json
{
  "+": [
    5.00,
    {
      "*": [
        { "var": "amount" },
        0.015
      ]
    }
  ]
}
```

### Conditional: Credit Card vs Debit Card

```json
{
  "if": [
    { "==": [{ "var": "payment_method" }, "credit_card"] },
    { "*": [{ "var": "amount" }, 0.035] },
    { "*": [{ "var": "amount" }, 0.015] }
  ]
}
```

### Tiered Pricing

```json
{
  "if": [
    { "<": [{ "var": "amount" }, 1000] },
    { "*": [{ "var": "amount" }, 0.03] },
    { "<": [{ "var": "amount" }, 10000] },
    { "*": [{ "var": "amount" }, 0.025] },
    { "*": [{ "var": "amount" }, 0.02] }
  ]
}
```

### Complex: Payment Method + Installments

```json
{
  "if": [
    {
      "and": [
        { "==": [{ "var": "payment_method" }, "credit_card"] },
        { ">": [{ "var": "installments" }, 1] }
      ]
    },
    {
      "+": [
        { "*": [{ "var": "amount" }, 0.035] },
        { "*": [{ "var": "installments" }, 0.5] }
      ]
    },
    { "*": [{ "var": "amount" }, 0.029] }
  ]
}
```

### Minimum Fee Cap

```json
{
  "max": [
    10.00,
    { "*": [{ "var": "amount" }, 0.02] }
  ]
}
```

### Maximum Fee Cap

```json
{
  "min": [
    500.00,
    { "*": [{ "var": "amount" }, 0.05] }
  ]
}
```

## Testing Rules

You can test rules before saving them:

```bash
curl -X POST http://localhost:8000/api/v1/rules/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "rule": {"*": [{"var": "amount"}, 0.025]},
    "test_data": {"amount": 1000}
  }'
```

## Common Patterns

| Pattern | JSON-Logic |
|---------|------------|
| Variable | `{"var": "field_name"}` |
| Addition | `{"+": [a, b]}` |
| Multiplication | `{"

}
```

## Further Reading

- [JSON-Logic Operators](https://jsonlogic.com/operations.html)
- [JSON-Logic Playground](https://jsonlogic.com/play.html)
- [Tempus API Documentation](../docs/api.md)
