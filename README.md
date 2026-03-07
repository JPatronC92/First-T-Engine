# ⏱️ Tempus Engine

[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_Now-blue?style=for-the-badge)](https://tempus-dashboard-tempus-8cbd8ab9.vercel.app/)
[![Deploy Status](https://therealsujitk-vercel-badge.vercel.app/?app=tempus-dashboard)](https://tempus-dashboard-tempus-8cbd8ab9.vercel.app/)

**The Universal, Time-Travel Compliance & Pricing Infrastructure.**

Tempus Engine allows financial institutions and SaaS platforms to process millions of transactions, apply dynamic pricing rules, and generate an immutable cryptographic audit trail—all at lightning speed.

🔗 **[Experience the Interactive Simulator](https://tempus-dashboard-tempus-8cbd8ab9.vercel.app)**

---

## ✨ Interactive Simulator Features

This repository branch hosts the **Public Interactive Simulator**, showcasing the raw power of the Tempus Engine by executing it entirely in the browser.

- **0ms Latency:** The Rust-based pricing engine is compiled to WebAssembly (WASM), allowing complex rules to be evaluated directly in the client with zero network overhead.
- **Dynamic Rule Adjustment:** Tweak parameters like *Take Rates*, *Fixed Fees*, *Risk Penalties*, and *Enterprise Discounts* via interactive sliders and see instant results.
- **High-Volume Stress Testing:** Evaluate complex rule sets against 100, 1K, 10K, or up to **1 Million transactions** simultaneously to test throughput.
- **Cryptographic Audit Trail:** Every rule evaluation generates a pseudo-immutable hash and a detailed breakdown of the exact rules applied, visually demonstrating how Tempus enables absolute state rebuilds for compliance ("Time Travel").
- **Business Telemetry:** Compare baseline revenue vs. projected revenue instantly to analyze the financial impact (Revenue Delta) of any pricing changes.

---

## 🛠 Tech Stack (Simulator)

- **Core Engine:** Rust (compiled to WebAssembly via `wasm-bindgen` and `jsonlogic`)
- **Frontend Dashboard:** Next.js (React 19) + Vanilla CSS for maximum visual performance.
- **Deployment:** Vercel

---

## 💻 Running Locally

To explore the dashboard and the WebAssembly integration on your local machine:

### Prerequisites
- Node.js (v18 or higher)

### Setup

1. **Clone the repository and switch to the simulator branch:**
   ```bash
   git clone https://github.com/JPatronC92/Tempus-Engine.git
   cd Tempus-Engine
   git checkout public-sim
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   cd tempus-dashboard
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## 🏗 Full Infrastructure

> **Note:** This branch (`public-sim`) is specifically optimized for the frontend WASM demonstration. 
> 
> For the complete backend infrastructure—including the Python (FastAPI) engine, PostgreSQL databases, Alembic migrations, and Docker configurations—please refer to the `main` branch of this repository.
