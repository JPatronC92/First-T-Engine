# Tempus Engine Interactive Demo

An interactive web-based demo showcasing the Tempus Pricing Engine capabilities.

## 🎯 Features

- **4 Pre-configured Scenarios**:
  - 🏪 **Marketplace**: Payment method fees (credit/debit/SPEI/OXXO)
  - 💻 **SaaS Usage-Based**: Tiered API pricing with volume discounts
  - 🏦 **Fintech Mexico**: SPEI/SIE with ISR/IVA withholding
  - 📊 **Volume Pricing**: Enterprise tiered pricing with commitments

- **Interactive Features**:
  - Real-time fee calculation
  - Time-travel date picker (see historical rates)
  - JSON-Logic rule visualization
  - Batch simulation with 1,000 transactions
  - Cryptographic audit hash generation
  - Code export (Python, Node.js, cURL)

## 🚀 Quick Start

### Option 1: Static Files (Recommended for Demo)

Simply open `index.html` in a web browser:

```bash
cd demo
python -m http.server 8080
# Open http://localhost:8080
```

### Option 2: GitHub Pages

Deploy to GitHub Pages for a live demo:

```bash
# In your repository root
git subtree push --prefix demo origin gh-pages
```

### Option 3: Connect to Real API

To use the demo with a real Tempus API backend:

1. Start the API server:
   ```bash
   cd ..
   uvicorn src.interfaces.api.main:app --reload
   ```

2. Update `app.js` to call the API instead of local calculations:
   ```javascript
   // Replace scenario.calculate() calls with:
   const response = await fetch('http://localhost:8000/api/v1/billing/calculate', {...})
   ```

## 📁 File Structure

```
demo/
├── index.html          # Main demo page
├── styles.css          # Styling
├── scenarios.js        # Pre-configured pricing scenarios
├── app.js              # Demo application logic
└── README.md           # This file
```

## 🎨 Customization

### Adding a New Scenario

1. Edit `scenarios.js` and add a new scenario object:

```javascript
myScenario: {
    name: "My Scenario",
    description: "Description here",
    icon: "🚀",
    currency: "USD",
    fields: [
        // Input fields...
    ],
    rules: [
        // JSON-Logic rules...
    ],
    calculate: (data) => {
        // Calculation logic...
        return { fees: [...], totalFees, netSettlement };
    }
}
```

2. Add scenario card to `index.html`

3. Done! The demo will automatically include it

### Modifying Styles

Edit `styles.css` - the design uses CSS variables for easy theming:

```css
:root {
    --primary: #6366f1;      /* Main brand color */
    --secondary: #06b6d4;    /* Accent color */
    --success: #10b981;      /* Success states */
    /* ... etc */
}
```

## 📊 Demo Calculations

**Note**: This demo performs calculations locally in JavaScript for instant feedback. In production, calculations should be performed by the Tempus API to ensure:

- Audit trail persistence
- Cryptographic hash verification
- Multi-tenant isolation
- Rule immutability guarantees

## 🔗 Links

- [Main Repository](https://github.com/JPatronC92/tempus-engine)
- [Documentation](../docs/)
- [API Reference](../docs/api.md)

## 📜 License

This demo is part of Tempus Engine and licensed under AGPL v3.
