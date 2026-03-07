<div align="center">
  <img src="tempus-dashboard/public/tempus_logo.png" alt="Tempus Logo" width="120" />
</div>

<h1 align="center">Tempus Engine — Live Sandbox ⚡</h1>

<p align="center">
  <b>The Deterministic & Time-Travel Pricing Infrastructure for High-Volume Digital Businesses.</b>
</p>

<p align="center">
  <a href="https://tempus-dashboard.vercel.app"><strong>👉 Try the Live Sandbox (0ms Latency) 👈</strong></a>
</p>

---

## 🌟 What is this branch? (`public-sim`)

This branch contains the **Live Sandbox**, a high-performance demonstration of the Tempus Engine. It showcases the core capabilities of our Rust-based processing engine compiled to WebAssembly (WASM), running directly in your browser.

By removing network latency, we demonstrate what the engine is capable of when deployed at the edge or deeply integrated into financial infra.

### Key Features of the Sandbox:

1. **Zero Latency "Live Ops":** Every time you adjust a slider (Take Rate, Processing Fee, Risk Surcharge), the entire dataset of rules is re-evaluated across thousands of transactions **instantly**.
2. **Deterministic Cryptographic Audit Trail:** Every single transaction evaluation generates an immutable SHA-256 event hash. This "Time Travel" capability means you can rewind state and prove *exactly* how a fee was calculated years ago.
3. **Universal Digital Business Model:** The sandbox abstracts away rigid industry templates into a single, highly flexible `Dynamic Digital Business` template, demonstrating how Tempus handles subscriptions, interchange-like commissions, and arbitrary penalties all at once.
4. **High-Volume Execution:** Capable of running a 1 Million Transaction Stress Test in a matter of seconds directly on the client thread.

## 🛠️ Technology Stack

*   **Core Engine:** Rust 🦀 (Parallelized with Rayon, handling up to 1.3M+ TPS natively).
*   **Browser Execution:** WebAssembly (WASM) 🕸️ via `wasm-bindgen`.
*   **Frontend Dashboard:** Next.js (App Router), React, and vanilla CSS for a sleek, Neo-mystical "hacker-finance" aesthetic.

## 🚀 Running Locally

If you want to run this sandbox interface locally on your machine:

```bash
# Clone the repository and checkout this branch
git clone https://github.com/JPatronC92/Tempus-Engine.git
cd Tempus-Engine
git checkout public-sim

# Navigate to the dashboard directory
cd tempus-dashboard

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Live Sandbox in your browser.

---

<p align="center">
  <i>Simulate before you ship. Stop Billing Drift before it happens.</i>
</p>
