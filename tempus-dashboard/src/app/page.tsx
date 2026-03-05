"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { initWasm, getWasm } from "../lib/wasm";
import { TEMPLATES, PricingTemplate } from "../data/templates";
import styles from "./simulator.module.css";

interface SimResult {
    fees: number[];
    totalRevenue: number;
    totalProcessed: number;
    avgFee: number;
    avgRate: number;
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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const resultsRef = useRef<HTMLElement>(null);

    useEffect(() => {
        initWasm().then(() => setWasmReady(true)).catch(console.error);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const ruleParam = params.get("rule");
        const txParam = params.get("tx");
        if (ruleParam) {
            try { setRuleJson(atob(ruleParam)); setShowAdvanced(true); } catch { /* ignore */ }
        }
        if (txParam) {
            try { setTxInput(atob(txParam)); setShowAdvanced(true); } catch { /* ignore */ }
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
                setError("Error en los datos de transacciones");
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
            const totalProcessed = expandedTx.reduce((a, b) => a + b.amount, 0);
            const avgFee = totalRevenue / fees.length;
            const avgRate = totalProcessed > 0 ? (totalRevenue / totalProcessed) * 100 : 0;

            setResult({ fees, totalRevenue, totalProcessed, avgFee, avgRate, timeMs: elapsed });

            // Smooth scroll to results
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            setError(message);
        }
    }, [wasmReady, ruleJson, txInput, txCount]);

    const copyShareUrl = () => {
        const base = window.location.origin + window.location.pathname;
        const url = `${base}?rule=${encodeURIComponent(btoa(ruleJson))}&tx=${encodeURIComponent(btoa(txInput))}`;
        navigator.clipboard.writeText(url);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2500);
    };

    const txLabels: Record<number, string> = {
        10: "10 transacciones",
        100: "100 transacciones",
        1000: "1,000 transacciones",
        10000: "10,000 transacciones",
        50000: "50,000 transacciones",
    };

    return (
        <main className={styles.container}>
            {/* Toast */}
            <div className={`${styles.toast} ${toastVisible ? styles.toastVisible : ""}`}>
                ✅ Link copiado al portapapeles
            </div>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.glowBlob}></div>
                <p className={styles.badge}>100% en tu navegador · Sin registro · Gratis</p>
                <h1 className={styles.title}>
                    Simula tu modelo de <span className={styles.accent}>comisiones</span> al instante
                </h1>
                <p className={styles.subtitle}>
                    Elige un modelo de cobro, ajusta las transacciones y descubre en milisegundos
                    cuánto generarías en comisiones. Motor Rust ejecutándose directo en tu navegador.
                </p>
                {!wasmReady && <div className={styles.loading}>⏳ Cargando motor de simulación...</div>}
            </section>

            {/* Step 1: Choose Model */}
            <section className={styles.section}>
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>1</span> Elige un modelo de cobro</h2>
                <div className={styles.templateGrid}>
                    {TEMPLATES.map((t) => (
                        <button
                            key={t.id}
                            className={`${styles.templateCard} ${selectedTemplate.id === t.id ? styles.active : ""}`}
                            onClick={() => selectTemplate(t)}
                            aria-label={`Seleccionar modelo: ${t.name}`}
                        >
                            <span className={styles.templateIcon}>{t.icon}</span>
                            <strong>{t.name}</strong>
                            <p>{t.description}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* Step 2: Volume */}
            <section className={styles.section}>
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>2</span> ¿Cuántas transacciones quieres simular?</h2>
                <div className={styles.volumeSelector}>
                    {Object.entries(txLabels).map(([val, label]) => (
                        <button
                            key={val}
                            className={`${styles.volumeBtn} ${txCount === Number(val) ? styles.volumeActive : ""}`}
                            onClick={() => setTxCount(Number(val))}
                            aria-label={`Simular ${label}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Step 3: Run */}
            <section className={styles.section} style={{ textAlign: "center" }}>
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>3</span> Ejecuta la simulación</h2>
                <div className={styles.actionRow}>
                    <button
                        className={styles.runBtn}
                        onClick={runSimulation}
                        disabled={!wasmReady}
                        aria-label="Ejecutar simulación"
                    >
                        🦀 Simular Ahora
                    </button>
                    <button
                        className={styles.shareBtn}
                        onClick={copyShareUrl}
                        aria-label="Copiar link para compartir"
                    >
                        🔗 Compartir
                    </button>
                </div>
            </section>

            {error && <div className={styles.errorBox}>❌ {error}</div>}

            {/* Results */}
            {result && (
                <section className={styles.results} ref={resultsRef}>
                    <h2>📊 Resultados de la Simulación</h2>
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <h3>${result.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p>Ingresos por Comisiones</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>${result.totalProcessed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p>Volumen Total Procesado</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{result.avgRate.toFixed(3)}%</h3>
                            <p>Tasa Efectiva Promedio</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{result.timeMs.toFixed(2)} ms</h3>
                            <p>Tiempo de Cálculo</p>
                        </div>
                    </div>

                    <div className={styles.feeTable}>
                        <h3>Desglose por Transacción (primeras 20)</h3>
                        <table>
                            <thead>
                                <tr><th>#</th><th>Monto</th><th>Comisión</th><th>Tasa</th></tr>
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

            {/* Advanced Toggle */}
            <section className={styles.section}>
                <button
                    className={styles.advancedToggle}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    aria-expanded={showAdvanced}
                    aria-label="Modo avanzado: editar reglas y datos manualmente"
                >
                    {showAdvanced ? "▼" : "▶"} Modo Avanzado — Editar reglas y datos manualmente
                </button>
                {showAdvanced && (
                    <div className={styles.editor}>
                        <div className={styles.editorPanel}>
                            <h3>Regla de Pricing (JSON)</h3>
                            <textarea
                                className={styles.codeArea}
                                value={ruleJson}
                                onChange={(e) => setRuleJson(e.target.value)}
                                rows={10}
                                aria-label="Editor de regla de pricing en JSON"
                            />
                        </div>
                        <div className={styles.editorPanel}>
                            <h3>Transacciones (JSON)</h3>
                            <textarea
                                className={styles.codeArea}
                                value={txInput}
                                onChange={(e) => setTxInput(e.target.value)}
                                rows={10}
                                aria-label="Editor de transacciones en JSON"
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>
                    Powered by <strong>Tempus Engine</strong> — Motor de pricing en Rust compilado a WebAssembly.
                    <br />Todos los cálculos se ejecutan localmente en tu navegador. Tus datos nunca salen de tu máquina.
                </p>
            </footer>
        </main>
    );
}
