use jsonlogic;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use rayon::prelude::*;
use serde_json::Value;

// ─────────────────────────────────────────────────────────────
// Helper: Extract a numeric result from a json-logic evaluation
// ─────────────────────────────────────────────────────────────
fn extract_numeric(result: Value) -> Result<f64, String> {
    match result {
        Value::Number(n) => n
            .as_f64()
            .ok_or_else(|| "Numeric result could not be converted to f64".to_string()),
        Value::String(s) => s
            .parse::<f64>()
            .map_err(|_| format!("String result '{}' is not a valid number", s)),
        Value::Bool(b) => Ok(if b { 1.0 } else { 0.0 }),
        Value::Null => Ok(0.0),
        other => Err(format!(
            "Expected numeric result, got: {}",
            serde_json::to_string(&other).unwrap_or_default()
        )),
    }
}

// ─────────────────────────────────────────────────────────────
// 1. evaluate_fee — Single transaction evaluation
// ─────────────────────────────────────────────────────────────
/// Evaluates a single pricing rule deterministically using json-logic.
/// Takes a JSON rule and a JSON transaction context, returns the calculated fee (f64).
#[pyfunction]
fn evaluate_fee(rule_json: &str, context_json: &str) -> PyResult<f64> {
    let rule: Value = serde_json::from_str(rule_json)
        .map_err(|e| PyValueError::new_err(format!("Error parsing rule: {}", e)))?;

    let context: Value = serde_json::from_str(context_json)
        .map_err(|e| PyValueError::new_err(format!("Error parsing context: {}", e)))?;

    let result = jsonlogic::apply(&rule, &context)
        .map_err(|e| PyValueError::new_err(format!("json-logic evaluation error: {}", e)))?;

    extract_numeric(result).map_err(|e| PyValueError::new_err(e))
}

// ─────────────────────────────────────────────────────────────
// 2. evaluate_batch — High-speed parallel batch evaluation
// ─────────────────────────────────────────────────────────────
/// Evaluates a pricing rule against a massive batch of transactions IN PARALLEL using Rayon.
/// The rule is parsed once and shared across all threads. Each transaction context is
/// evaluated independently, achieving near-linear speedup on multi-core CPUs.
///
/// Returns a Vec<f64> of fees. Malformed transactions return 0.0 (fail-safe).
#[pyfunction]
fn evaluate_batch(rule_json: &str, contexts_json: Vec<String>) -> PyResult<Vec<f64>> {
    let rule: Value = serde_json::from_str(rule_json)
        .map_err(|e| PyValueError::new_err(format!("Error parsing rule: {}", e)))?;

    // Rayon parallel iterator — distributes across all available CPU cores
    let results: Vec<f64> = contexts_json
        .par_iter()
        .map(|ctx_str| {
            let context: Value = match serde_json::from_str(ctx_str) {
                Ok(c) => c,
                Err(_) => return 0.0, // Fail-safe: skip malformed JSON
            };

            match jsonlogic::apply(&rule, &context) {
                Ok(val) => extract_numeric(val).unwrap_or(0.0),
                Err(_) => 0.0,
            }
        })
        .collect();

    Ok(results)
}

// ─────────────────────────────────────────────────────────────
// 3. evaluate_batch_detailed — Batch with per-transaction error reporting
// ─────────────────────────────────────────────────────────────
/// Like evaluate_batch, but returns a tuple of (fees, errors).
/// `errors` is a Vec of strings where each entry is either empty "" (success)
/// or contains the error message for that specific transaction index.
/// This is critical for CFO-level audit trails.
#[pyfunction]
fn evaluate_batch_detailed(
    rule_json: &str,
    contexts_json: Vec<String>,
) -> PyResult<(Vec<f64>, Vec<String>)> {
    let rule: Value = serde_json::from_str(rule_json)
        .map_err(|e| PyValueError::new_err(format!("Error parsing rule: {}", e)))?;

    let results: Vec<(f64, String)> = contexts_json
        .par_iter()
        .map(|ctx_str| {
            let context: Value = match serde_json::from_str(ctx_str) {
                Ok(c) => c,
                Err(e) => return (0.0, format!("JSON parse error: {}", e)),
            };

            match jsonlogic::apply(&rule, &context) {
                Ok(val) => match extract_numeric(val) {
                    Ok(fee) => (fee, String::new()),
                    Err(e) => (0.0, e),
                },
                Err(e) => (0.0, format!("json-logic error: {}", e)),
            }
        })
        .collect();

    let fees: Vec<f64> = results.iter().map(|(f, _)| *f).collect();
    let errors: Vec<String> = results.into_iter().map(|(_, e)| e).collect();

    Ok((fees, errors))
}

// ─────────────────────────────────────────────────────────────
// 4. validate_rule — Pre-flight check for json-logic rules
// ─────────────────────────────────────────────────────────────
/// Validates that a json-logic rule is syntactically correct by running it
/// against a minimal test context. Returns true if valid, raises PyValueError if not.
/// Use this in the Rule Builder to validate before saving to the database.
#[pyfunction]
fn validate_rule(rule_json: &str) -> PyResult<bool> {
    let rule: Value = serde_json::from_str(rule_json)
        .map_err(|e| PyValueError::new_err(format!("Invalid JSON: {}", e)))?;

    // Test against a minimal context with common variables
    let test_context = serde_json::json!({
        "amount": 100.0,
        "total_volume": 1000.0,
        "method": "CREDIT_CARD"
    });

    match jsonlogic::apply(&rule, &test_context) {
        Ok(_) => Ok(true),
        Err(e) => Err(PyValueError::new_err(format!(
            "Rule validation failed: {}",
            e
        ))),
    }
}

// ─────────────────────────────────────────────────────────────
// 5. get_core_info — Metadata about the Rust engine
// ─────────────────────────────────────────────────────────────
/// Returns metadata about the Rust core for health checks and diagnostics.
#[pyfunction]
fn get_core_info() -> PyResult<String> {
    let info = serde_json::json!({
        "engine": "tempus_core",
        "version": env!("CARGO_PKG_VERSION"),
        "parallelism": "rayon",
        "available_threads": rayon::current_num_threads(),
        "evaluator": "jsonlogic-rs",
    });
    Ok(serde_json::to_string(&info).unwrap())
}

// ─────────────────────────────────────────────────────────────
// PyO3 Module Registration
// ─────────────────────────────────────────────────────────────
#[pymodule]
fn tempus_core(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(evaluate_fee, m)?)?;
    m.add_function(wrap_pyfunction!(evaluate_batch, m)?)?;
    m.add_function(wrap_pyfunction!(evaluate_batch_detailed, m)?)?;
    m.add_function(wrap_pyfunction!(validate_rule, m)?)?;
    m.add_function(wrap_pyfunction!(get_core_info, m)?)?;
    Ok(())
}
