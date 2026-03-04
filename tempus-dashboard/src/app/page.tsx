"use client";

import { useState, useEffect, useCallback } from "react";
import { initWasm, getWasm } from "../lib/wasm";
import { TEMPLATES, PricingTemplate } from "../data/templates";
import styles from "./simulator.module.css";

interface SimResult {
    fees: number[];
    totalRevenue: number;
    avgFee: number;
    timeMs: number;
}

export default function PublicSimulator() {
    const [wasmReady, setWasmReady] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<PricingTemplate>(TEMPLATES[0]);
    const [ruleJson, setRuleJson] = useState(JSON.stringify(TEMPLATES[0].rule, null, 2));
    const [txInput, setTxInput] = useState(JSON.stringify(TEMPLATES[0].sampleTransactions, null, 2));
    const [result, setResult] = useState<SimResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [txCount, setTxCount] = useState(10);

    useEffect(() => {
        initWasm().then(() => setWasmReady(true)).catch(console.error);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const ruleParam = params.get("rule");
        const txParam = params.get("tx");
        if (ruleParam) {
            try { setRuleJson(atob(ruleParam)); } catch { /* ignore */ }
        }
        if (txParam) {
            try { setTxInput(atob(txParam)); } catch { /* ignore */ }
        }
    }, []);

    const selectTemplate = (template: PricingTemplate) => {
        setSelectedTemplate(template);
        setRuleJson(JSON.stringify(template.rule, null, 2));
        setTxInput(JSON.stringify(template.sampleTransactions, null, 2));
        setResult(null);
        setError(null);
    };

    const runSimulation = useCallback(() => {
        if (!wasmReady) return;
        setError(null);

        try {
            const wasm = getWasm();
            let transactions: { amount: number }[];
            try { transactions = JSON.parse(txInput); } catch {
                setError("Invalid JSON in transactions input");
                return;
            }

            let expandedTx = transactions;
            if (txCount > transactions.length) {
                const multiplier = Math.ceil(txCount / transactions.length);
                expandedTx = [];
                for (let i = 0; i < multiplier; i++) expandedTx.push(...transactions);
                expandedTx = expandedTx.slice(0, txCount);
            }

            const start = performance.now();
            const resultJson = wasm.evaluate_batch_wasm(ruleJson, JSON.stringify(expandedTx));
            const elapsed = performance.now() - start;

            const fees: number[] = JSON.parse(resultJson);
            const totalRevenue = fees.reduce((a, b) => a + b, 0);
            const avgFee = totalRevenue / fees.length;

            setResult({ fees, totalRevenue, avgFee, timeMs: elapsed });
        } catch (e: any) {
            setError(e.message || String(e));
        }
    }, [wasmReady, ruleJson, txInput, txCount]);

    const copyShareUrl = () => {
        const base = window.location.origin + window.location.pathname;
        const url = `${base}?rule=${encodeURIComponent(btoa(ruleJson))}&tx=${encodeURIComponent(btoa(txInput))}`;
        navigator.clipboard.writeText(url);
    };

    return (
        <main className={styles.container}>
            <section className={styles.hero}>
                <div className={styles.glowBlob}></div>
                <h1 className={styles.title}>
                    Tempus <span className={styles.accent}>Public Simulator</span>
                </h1>
                <p className={styles.subtitle}>
                    Test any pricing structure against thousands of transactions — powered by Rust, running in your browser. Zero backend. Zero cost.
                </p>
                {!wasmReady && <div className={styles.loading}>⏳ Loading Rust Engine (WASM)...</div>}
            </section>

            <section className={styles.templates}>
                <h2>Choose a Pricing Model</h2>
                <div className={styles.templateGrid}>
                    {TEMPLATES.map((t) => (
                        <button
                            key={t.id}
                            className={`${styles.templateCard} ${selectedTemplate.id === t.id ? styles.active : ""}`}
                            onClick={() => selectTemplate(t)}
                        >
                            <span className={styles.templateIcon}>{t.icon}</span>
                            <strong>{t.name}</strong>
                            <p>{t.description}</p>
                        </button>
                    ))}
                </div>
            </section>

            <section className={styles.editor}>
                <div className={styles.editorPanel}>
                    <h3>📐 Pricing Rule (json-logic)</h3>
                    <textarea
                        className={styles.codeArea}
                        value={ruleJson}
                        onChange={(e) => setRuleJson(e.target.value)}
                        rows={10}
                    />
                </div>
                <div className={styles.editorPanel}>
                    <h3>💰 Transactions (JSON array)</h3>
                    <textarea
                        className={styles.codeArea}
                        value={txInput}
                        onChange={(e) => setTxInput(e.target.value)}
                        rows={10}
                    />
                </div>
            </section>

            <section className={styles.controls}>
                <div className={styles.txCountControl}>
                    <label>Multiply to:</label>
                    <select value={txCount} onChange={(e) => setTxCount(Number(e.target.value))}>
                        <option value={10}>10 txs</option>
                        <option value={100}>100 txs</option>
                        <option value={1000}>1,000 txs</option>
                        <option value={10000}>10,000 txs</option>
                        <option value={50000}>50,000 txs</option>
                    </select>
                </div>
                <button className={styles.runBtn} onClick={runSimulation} disabled={!wasmReady}>
                    🦀 Run Simulation
                </button>
                <button className={styles.shareBtn} onClick={copyShareUrl}>
                    🔗 Copy Share URL
                </button>
            </section>

            {error && <div className={styles.errorBox}>❌ {error}</div>}

            {result && (
                <section className={styles.results}>
                    <h2>Simulation Results</h2>
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <h3>${result.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p>Total Revenue (Fees)</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>${result.avgFee.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</h3>
                            <p>Average Fee</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{result.timeMs.toFixed(2)} ms</h3>
                            <p>Evaluation Time</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{result.fees.length.toLocaleString()}</h3>
                            <p>Transactions Processed</p>
                        </div>
                    </div>

                    <div className={styles.feeTable}>
                        <h3>Fee Breakdown (first 20)</h3>
                        <table>
                            <thead>
                                <tr><th>#</th><th>Amount</th><th>Fee</th><th>Rate</th></tr>
                            </thead>
                            <tbody>
                                {result.fees.slice(0, 20).map((fee, i) => {
                                    const txs = JSON.parse(txInput);
                                    const amount = txs[i % txs.length]?.amount ?? 0;
                                    const rate = amount > 0 ? ((fee / amount) * 100).toFixed(3) : "0";
                                    return (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>${amount.toLocaleString()}</td>
                                            <td>${fee.toFixed(2)}</td>
                                            <td>{rate}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <footer className={styles.footer}>
                <p>
                    Powered by <strong>Tempus Engine</strong> — Rust-native pricing compiled to WebAssembly.
                    <br />All calculations run locally in your browser. Your data never leaves your machine.
                </p>
            </footer>
        </main>
    );
}
