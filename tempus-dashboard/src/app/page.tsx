"use client";

import { useState, useEffect, useCallback } from "react";
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
    opsPerSec: number;
    timePerTx: number;
}

export default function PublicSimulator() {
    const [wasmReady, setWasmReady] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<PricingTemplate>(TEMPLATES[0]);
    const [ruleJson, setRuleJson] = useState(JSON.stringify(TEMPLATES[0].rule, null, 2));
    const [txInput, setTxInput] = useState(JSON.stringify(TEMPLATES[0].sampleTransactions, null, 2));
    const [result, setResult] = useState<SimResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [txCount, setTxCount] = useState(10000);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [copied, setCopied] = useState(false);

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
        setIsRunning(true);

        // Small delay for visual effect
        setTimeout(() => {
            try {
                const wasm = getWasm();
                let transactions: { amount: number }[];
                try { transactions = JSON.parse(txInput); } catch {
                    setError("Error en los datos de transacciones");
                    setIsRunning(false);
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
                const opsPerSec = elapsed > 0 ? Math.round(fees.length / (elapsed / 1000)) : 0;
                const timePerTx = elapsed / fees.length;

                setResult({ fees, totalRevenue, totalProcessed, avgFee, avgRate, timeMs: elapsed, opsPerSec, timePerTx });
                setIsRunning(false);
            } catch (e: any) {
                setError(e.message || String(e));
                setIsRunning(false);
            }
        }, 150);
    }, [wasmReady, ruleJson, txInput, txCount]);

    const copyShareUrl = () => {
        const base = window.location.origin + window.location.pathname;
        const templateSlug = selectedTemplate.id;
        const url = `${base}?rule=${encodeURIComponent(btoa(ruleJson))}&tx=${encodeURIComponent(btoa(txInput))}&vol=${txCount}&tpl=${templateSlug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatOps = (ops: number) => {
        if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(1)}M`;
        if (ops >= 1_000) return `${(ops / 1_000).toFixed(0)}K`;
        return ops.toString();
    };

    const txLabels: Record<number, string> = {
        100: "100",
        1000: "1K",
        10000: "10K",
        50000: "50K",
    };

    return (
        <main className={styles.container}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.glowBlob}></div>
                <div className={styles.glowBlob2}></div>
                <p className={styles.badge}>⚡ Motor Rust · WebAssembly · Privacidad total</p>
                <h1 className={styles.title}>Tempus Engine</h1>
                <p className={styles.tagline}>
                    Motor determinista de reglas para <span className={styles.accent}>pricing</span>, <span className={styles.accent}>comisiones</span> y <span className={styles.accent}>simulación masiva</span>.
                </p>
                <p className={styles.subtitle}>
                    Prueba cualquier modelo de cobro contra miles de transacciones en milisegundos.
                    100% en tu navegador. Tus datos nunca salen de tu máquina.
                </p>
                {!wasmReady && <div className={styles.loading}>⏳ Inicializando motor Rust...</div>}
                {wasmReady && <div className={styles.ready}>✅ Motor listo — 0ms de latencia de red</div>}
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
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>2</span> Volumen de transacciones</h2>
                <div className={styles.volumeSelector}>
                    {Object.entries(txLabels).map(([val, label]) => (
                        <button
                            key={val}
                            className={`${styles.volumeBtn} ${txCount === Number(val) ? styles.volumeActive : ""}`}
                            onClick={() => setTxCount(Number(val))}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Step 3: Run */}
            <section className={styles.section} style={{ textAlign: "center" }}>
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>3</span> Ejecuta el motor</h2>
                <div className={styles.actionRow}>
                    <button
                        className={`${styles.runBtn} ${isRunning ? styles.runBtnActive : ""}`}
                        onClick={runSimulation}
                        disabled={!wasmReady || isRunning}
                    >
                        {isRunning ? "⚡ Procesando..." : "⚡ Ejecutar Motor"}
                    </button>
                </div>
            </section>

            {error && <div className={styles.errorBox}>❌ {error}</div>}

            {/* ═══ WOW RESULTS ═══ */}
            {result && (
                <section className={styles.results}>
                    {/* Speed Banner */}
                    <div className={styles.speedBanner}>
                        <div className={styles.speedMetric}>
                            <span className={styles.speedValue}>{result.timeMs.toFixed(2)}</span>
                            <span className={styles.speedUnit}>ms</span>
                            <span className={styles.speedLabel}>Tiempo total</span>
                        </div>
                        <div className={styles.speedDivider}></div>
                        <div className={styles.speedMetric}>
                            <span className={styles.speedValue}>{formatOps(result.opsPerSec)}</span>
                            <span className={styles.speedUnit}>ops/s</span>
                            <span className={styles.speedLabel}>Velocidad</span>
                        </div>
                        <div className={styles.speedDivider}></div>
                        <div className={styles.speedMetric}>
                            <span className={styles.speedValue}>{result.fees.length.toLocaleString()}</span>
                            <span className={styles.speedUnit}>txs</span>
                            <span className={styles.speedLabel}>Procesadas</span>
                        </div>
                        <div className={styles.speedDivider}></div>
                        <div className={styles.speedMetric}>
                            <span className={styles.speedValue}>{(result.timePerTx * 1000).toFixed(2)}</span>
                            <span className={styles.speedUnit}>µs/tx</span>
                            <span className={styles.speedLabel}>Por transacción</span>
                        </div>
                    </div>

                    {/* Financial Results */}
                    <h2 className={styles.resultsTitle}>📊 Impacto Financiero</h2>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statCard} ${styles.statHighlight}`}>
                            <h3>${result.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p>Comisiones Generadas</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>${result.totalProcessed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p>Volumen Procesado</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{result.avgRate.toFixed(3)}%</h3>
                            <p>Tasa Efectiva</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>${result.avgFee.toFixed(4)}</h3>
                            <p>Comisión Promedio</p>
                        </div>
                    </div>

                    {/* Visual Breakdown Bar */}
                    <div className={styles.breakdownSection}>
                        <h3>Distribución de Comisiones</h3>
                        <div className={styles.breakdownBar}>
                            <div className={styles.breakdownFill} style={{ width: `${result.avgRate}%` }}>
                                <span>{result.avgRate.toFixed(2)}% comisión</span>
                            </div>
                            <div className={styles.breakdownRest}>
                                <span>{(100 - result.avgRate).toFixed(2)}% payout al merchant</span>
                            </div>
                        </div>
                        <div className={styles.breakdownLegend}>
                            <span><span className={styles.dotBlue}></span> Tu revenue: ${result.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                            <span><span className={styles.dotGray}></span> Payout: ${(result.totalProcessed - result.totalRevenue).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    {/* Fee Table */}
                    <div className={styles.feeTable}>
                        <h3>Desglose por Transacción</h3>
                        <table>
                            <thead>
                                <tr><th>#</th><th>Monto</th><th>Comisión</th><th>Tasa</th><th>Payout</th></tr>
                            </thead>
                            <tbody>
                                {result.fees.slice(0, 15).map((fee, i) => {
                                    const txs = JSON.parse(txInput);
                                    const amount = txs[i % txs.length]?.amount ?? 0;
                                    const rate = amount > 0 ? ((fee / amount) * 100).toFixed(3) : "0";
                                    const payout = amount - fee;
                                    return (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>${amount.toLocaleString()}</td>
                                            <td className={styles.feeHighlight}>${fee.toFixed(2)}</td>
                                            <td>{rate}%</td>
                                            <td>${payout.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {result.fees.length > 15 && (
                            <p className={styles.tableNote}>... y {(result.fees.length - 15).toLocaleString()} transacciones más</p>
                        )}
                    </div>

                    {/* Share */}
                    <div className={styles.shareSection}>
                        <button className={styles.shareBtnLarge} onClick={copyShareUrl}>
                            {copied ? "✅ ¡Link copiado!" : "🔗 Compartir esta simulación"}
                        </button>
                        <p className={styles.shareNote}>Cualquiera con el link verá exactamente los mismos resultados</p>
                    </div>
                </section>
            )}

            {/* Advanced Toggle */}
            <section className={styles.section}>
                <button
                    className={styles.advancedToggle}
                    onClick={() => setShowAdvanced(!showAdvanced)}
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
                            />
                        </div>
                        <div className={styles.editorPanel}>
                            <h3>Transacciones (JSON)</h3>
                            <textarea
                                className={styles.codeArea}
                                value={txInput}
                                onChange={(e) => setTxInput(e.target.value)}
                                rows={10}
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <p className={styles.footerBrand}>Tempus Engine</p>
                <p>Motor de pricing determinista compilado de Rust a WebAssembly.</p>
                <p>Todos los cálculos se ejecutan localmente. Tus datos nunca salen de tu navegador.</p>
            </footer>
        </main>
    );
}
