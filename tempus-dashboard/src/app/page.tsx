"use client";

import { useState, useEffect, useCallback } from "react";
import { initWasm, getWasm } from "../lib/wasm";
import { TEMPLATES, PricingTemplate, PricingRule, RuleParam, rebuildRule } from "../data/templates";
import styles from "./simulator.module.css";

interface SimResult {
    fees: number[];
    ruleFees: { [ruleId: string]: number[] };
    totalRevenue: number;
    ruleRevenue: { [ruleId: string]: number };
    totalProcessed: number;
    avgFee: number;
    avgRate: number;
    timeMs: number;
    opsPerSec: number;
    timePerTx: number;
    baselineRevenue?: number;
}

export default function PublicSimulator() {
    const [wasmReady, setWasmReady] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<PricingTemplate>(TEMPLATES[0]);
    const [activeRules, setActiveRules] = useState<PricingRule[]>(TEMPLATES[0].rules);
    const [rulesJson, setRulesJson] = useState(JSON.stringify(TEMPLATES[0].rules, null, 2));
    const [txInput, setTxInput] = useState(JSON.stringify(TEMPLATES[0].sampleTransactions, null, 2));
    const [result, setResult] = useState<SimResult | null>(null);
    const [baselineResult, setBaselineResult] = useState<SimResult | null>(null);
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
        const rulesParam = params.get("rules");
        const txParam = params.get("tx");
        const tplParam = params.get("tpl");

        if (tplParam) {
            const tpl = TEMPLATES.find(t => t.id === tplParam);
            if (tpl) {
                setSelectedTemplate(tpl);
                setActiveRules(tpl.rules);
                setRulesJson(JSON.stringify(tpl.rules, null, 2));
                setTxInput(JSON.stringify(tpl.sampleTransactions, null, 2));
            }
        }

        if (rulesParam) {
            try {
                const decoded = JSON.parse(decodeURIComponent(escape(atob(rulesParam))));
                setActiveRules(decoded);
                setRulesJson(JSON.stringify(decoded, null, 2));
                setShowAdvanced(true);
            } catch { /* ignore */ }
        }
        if (txParam) {
            try {
                setTxInput(decodeURIComponent(escape(atob(txParam))));
                setShowAdvanced(true);
            } catch { /* ignore */ }
        }
    }, []);

    const selectTemplate = (template: PricingTemplate) => {
        setSelectedTemplate(template);
        setActiveRules(template.rules);
        setRulesJson(JSON.stringify(template.rules, null, 2));
        setTxInput(JSON.stringify(template.sampleTransactions, null, 2));
        setResult(null);
        setBaselineResult(null);
        setError(null);
    };

    const updateRuleParam = (ruleId: string, paramKey: string, newValue: number) => {
        setActiveRules(prev => {
            const updated = prev.map(rule => {
                if (rule.id !== ruleId) return rule;
                const updatedParams = rule.params.map(p => p.key === paramKey ? { ...p, value: newValue } : p);
                const newRuleObj = rebuildRule(rule.id, updatedParams);
                return {
                    ...rule,
                    params: updatedParams,
                    rule: newRuleObj
                };
            });
            setRulesJson(JSON.stringify(updated, null, 2));
            return updated;
        });
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

                let rulesToEvaluate = activeRules;
                try {
                    const manualRules = JSON.parse(rulesJson);
                    if (Array.isArray(manualRules)) rulesToEvaluate = manualRules;
                } catch {
                    // Fallback to activeRules if manual json is invalid
                }

                const start = performance.now();

                const expandedTxStr = JSON.stringify(expandedTx);
                const rulesJsonStr = JSON.stringify(rulesToEvaluate.map(r => r.rule));

                // 1. First run for main results
                const resultJson = wasm.evaluate_batch_multi_wasm(rulesJsonStr, expandedTxStr);

                // 2. Second run for Determinism Verification
                const resultJson2 = wasm.evaluate_batch_multi_wasm(rulesJsonStr, expandedTxStr);
                const isDeterministic = resultJson === resultJson2;

                const rawResults: { total_fee: number, rule_fees: number[] }[] = JSON.parse(resultJson);

                const elapsed = performance.now() - start;

                let ruleFees: { [ruleId: string]: number[] } = {};
                let ruleRevenue: { [ruleId: string]: number } = {};
                rulesToEvaluate.forEach(r => {
                    ruleFees[r.id] = new Array(expandedTx.length).fill(0);
                    ruleRevenue[r.id] = 0;
                });

                let allFees: number[] = new Array(expandedTx.length).fill(0);
                let totalRevenue = 0;

                for (let i = 0; i < rawResults.length; i++) {
                    const res = rawResults[i];
                    allFees[i] = res.total_fee;
                    totalRevenue += res.total_fee;

                    for (let j = 0; j < rulesToEvaluate.length; j++) {
                        const ruleId = rulesToEvaluate[j].id;
                        const fee = res.rule_fees[j];
                        ruleFees[ruleId][i] = fee;
                        ruleRevenue[ruleId] += fee;
                    }
                }

                const totalProcessed = expandedTx.reduce((a, b) => a + b.amount, 0);
                const avgFee = totalRevenue / allFees.length;
                const avgRate = totalProcessed > 0 ? (totalRevenue / totalProcessed) * 100 : 0;
                const totalOps = allFees.length * rulesToEvaluate.length * 2; // * 2 because we evaluate twice for determinism check
                const opsPerSec = elapsed > 0 ? Math.round((allFees.length * rulesToEvaluate.length) / (elapsed / 2 / 1000)) : 0;
                const timePerTx = (elapsed / 2) / allFees.length;

                const newResult = {
                    fees: allFees,
                    ruleFees,
                    totalRevenue,
                    ruleRevenue,
                    totalProcessed,
                    avgFee,
                    avgRate,
                    timeMs: elapsed / 2,
                    opsPerSec,
                    timePerTx,
                    isDeterministic,
                    inputSizeKb: Math.round(new Blob([expandedTxStr]).size / 1024),
                    outputSizeKb: Math.round(new Blob([resultJson]).size / 1024)
                };

                setResult(prev => {
                    if (!prev && !baselineResult) setBaselineResult(newResult as unknown as SimResult);
                    return newResult as unknown as SimResult;
                });
                setIsRunning(false);
            } catch (e: any) {
                setError(e.message || String(e));
                setIsRunning(false);
            }
        }, 150);
    }, [wasmReady, activeRules, rulesJson, txInput, txCount, baselineResult]);

    const copyShareUrl = () => {
        const base = window.location.origin + window.location.pathname;
        const templateSlug = selectedTemplate.id;
        const url = `${base}?rules=${encodeURIComponent(btoa(unescape(encodeURIComponent(rulesJson))))}&tx=${encodeURIComponent(btoa(unescape(encodeURIComponent(txInput))))}&vol=${txCount}&tpl=${templateSlug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadScenario = () => {
        const scenario = {
            metadata: {
                template: selectedTemplate.id,
                name: selectedTemplate.name,
                exported_at: new Date().toISOString()
            },
            rules: activeRules,
            transactions: JSON.parse(txInput)
        };
        const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tempus-scenario-${selectedTemplate.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

            {/* Step 2: Configure Pricing Model */}
            <section className={styles.section}>
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>2</span> Configura los parámetros</h2>
                <div className={styles.paramEditor}>
                    {activeRules.map(rule => (
                        <div key={rule.id} className={styles.ruleEditorCard}>
                            <h4>{rule.name}</h4>
                            <p className={styles.ruleDesc}>{rule.description}</p>
                            <div className={styles.paramList}>
                                {rule.params.map(param => (
                                    <div key={param.key} className={styles.paramRow}>
                                        <div className={styles.paramHeader}>
                                            <span className={styles.paramLabel}>{param.label}</span>
                                            <span className={styles.paramValue}>{param.value}{param.suffix}</span>
                                        </div>
                                        <input
                                            type="range"
                                            className={styles.paramSlider}
                                            min={param.min}
                                            max={param.max}
                                            step={param.step}
                                            value={param.value}
                                            onChange={(e) => updateRuleParam(rule.id, param.key, parseFloat(e.target.value))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Step 3: Volume */}
            <section className={styles.section}>
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>3</span> Volumen de transacciones</h2>
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

            {/* Step 4: Run */}
            <section className={styles.section} style={{ textAlign: "center" }}>
                <h2 className={styles.stepTitle}><span className={styles.stepNum}>4</span> Ejecuta el motor</h2>
                <div className={styles.actionRow}>
                    <button
                        className={`${styles.runBtn} ${isRunning ? styles.runBtnActive : ""}`}
                        onClick={runSimulation}
                        disabled={!wasmReady || isRunning}
                    >
                        {isRunning ? `⚡ Evaluando ${(txCount * activeRules.length).toLocaleString()} operaciones...` : "⚡ Ejecutar Motor"}
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

                    {/* Telemetry */}
                    <div className={styles.telemetryPanel}>
                        <div className={styles.telemetryHeader}>
                            <span className={styles.dotTeal}></span> Telemetría del Engine WASM
                        </div>
                        <div className={styles.telemetryGrid}>
                            <div className={styles.telemetryItem}>
                                <span className={styles.telemetryLabel}>Tiempo Eval</span>
                                <span className={styles.telemetryValue}>{result.timeMs.toFixed(2)} ms</span>
                            </div>
                            <div className={styles.telemetryItem}>
                                <span className={styles.telemetryLabel}>Throughput</span>
                                <span className={styles.telemetryValue}>{formatOps(result.opsPerSec)} ops/s</span>
                            </div>
                            <div className={styles.telemetryItem}>
                                <span className={styles.telemetryLabel}>Determinismo</span>
                                <span className={styles.telemetryValue}>{(result as any).isDeterministic ? '✅ Verificado (Hash match)' : '❌ Fallido'}</span>
                            </div>
                            <div className={styles.telemetryItem}>
                                <span className={styles.telemetryLabel}>E/S Payload</span>
                                <span className={styles.telemetryValue}>In: {(result as any).inputSizeKb} KB / Out: {(result as any).outputSizeKb} KB</span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Results */}
                    <h2 className={styles.resultsTitle}>📊 Impacto Financiero</h2>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statCard} ${styles.statHighlight}`}>
                            <h3>
                                ${result.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                {baselineResult && result.totalRevenue !== baselineResult.totalRevenue && (
                                    <span className={result.totalRevenue > baselineResult.totalRevenue ? styles.diffPositive : styles.diffNegative}>
                                        {result.totalRevenue > baselineResult.totalRevenue ? "+" : ""}{(((result.totalRevenue - baselineResult.totalRevenue) / baselineResult.totalRevenue) * 100).toFixed(1)}% vs base
                                    </span>
                                )}
                            </h3>
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
                                <tr><th>#</th><th>Monto</th><th>Comisión Total</th>
                                    {activeRules.map(r => (
                                        <th key={r.id}>{r.name}</th>
                                    ))}
                                    <th>Tasa</th><th>Payout</th></tr>
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
                                            {activeRules.map(r => (
                                                <td key={r.id}>
                                                    ${(result.ruleFees[r.id]?.[i] ?? 0).toFixed(2)}
                                                </td>
                                            ))}
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
                        <div className={styles.shareRow}>
                            <button className={styles.shareBtnLarge} onClick={copyShareUrl}>
                                {copied ? "✅ ¡Link copiado!" : "🔗 Compartir esta simulación"}
                            </button>
                            <button className={styles.exportBtnLarge} onClick={downloadScenario}>
                                💾 Export Scenario
                            </button>
                        </div>
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
                                value={rulesJson}
                                onChange={(e) => setRulesJson(e.target.value)}
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
