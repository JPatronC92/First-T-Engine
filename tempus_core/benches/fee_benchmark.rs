use criterion::{black_box, criterion_group, criterion_main, Criterion};
use jsonlogic;
use serde_json::Value;

fn bench_single_evaluation(c: &mut Criterion) {
    let rule_str = r#"{"*": [{"var": "amount"}, 0.029]}"#;
    let context_str = r#"{"amount": 1500.0, "method": "CREDIT_CARD"}"#;

    let rule: Value = serde_json::from_str(rule_str).unwrap();
    let context: Value = serde_json::from_str(context_str).unwrap();

    c.bench_function("single_fee_evaluation", |b| {
        b.iter(|| {
            let result = jsonlogic::apply(black_box(&rule), black_box(&context)).unwrap();
            black_box(result);
        })
    });
}

fn bench_batch_10k(c: &mut Criterion) {
    let rule_str = r#"{"if": [{">": [{"var": "amount"}, 1000]}, {"*": [{"var": "amount"}, 0.025]}, {"*": [{"var": "amount"}, 0.035]}]}"#;
    let rule: Value = serde_json::from_str(rule_str).unwrap();

    let contexts: Vec<Value> = (0..10_000)
        .map(|i| serde_json::json!({"amount": (i as f64) * 1.5}))
        .collect();

    c.bench_function("batch_10k_sequential", |b| {
        b.iter(|| {
            let results: Vec<f64> = contexts
                .iter()
                .map(|ctx| match jsonlogic::apply(black_box(&rule), ctx) {
                    Ok(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
                    _ => 0.0,
                })
                .collect();
            black_box(results);
        })
    });
}

fn bench_tiered_rule(c: &mut Criterion) {
    // Complex nested if/then/else tiered pricing
    let rule_str = r#"{
        "if": [
            {">": [{"var": "amount"}, 10000]},
            {"*": [{"var": "amount"}, 0.015]},
            {"if": [
                {">": [{"var": "amount"}, 5000]},
                {"*": [{"var": "amount"}, 0.025]},
                {"if": [
                    {">": [{"var": "amount"}, 1000]},
                    {"*": [{"var": "amount"}, 0.03]},
                    {"*": [{"var": "amount"}, 0.035]}
                ]}
            ]}
        ]
    }"#;

    let rule: Value = serde_json::from_str(rule_str).unwrap();
    let context: Value = serde_json::json!({"amount": 7500.0});

    c.bench_function("tiered_4level_evaluation", |b| {
        b.iter(|| {
            let result = jsonlogic::apply(black_box(&rule), black_box(&context)).unwrap();
            black_box(result);
        })
    });
}

criterion_group!(
    benches,
    bench_single_evaluation,
    bench_batch_10k,
    bench_tiered_rule
);
criterion_main!(benches);
