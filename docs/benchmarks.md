# Benchmarks

Tempus achieves exceptional evaluation speeds thanks to the Rust-native `tempus_core` engine compiled via PyO3.

## Benchmark Environment
- **CPU:** 16 threads (x86_64)
- **Rust:** v1.93.1 (stable)
- **Crate:** `jsonlogic` 0.5.1 + `rayon` 1.11 for parallelism
- **Tool:** Criterion.rs statistical benchmarks (100 samples)

## Results

| Benchmark | Median Time | Throughput |
|---|---|---|
| **Single fee evaluation** (flat `amount * 0.029`) | **161.76 ns** | **~6.2M TPS** |
| **Batch 10K sequential** (if/else tiered) | **4.86 ms** | **~2.06M TPS** |
| **Complex 4-level tiered rule** (nested if/then/else) | **1.15 µs** | **~870K TPS** |

> [!NOTE]
> These benchmarks measure raw json-logic evaluation speed in Rust, excluding network and database overhead. In a real-world API call, the total latency also includes PostgreSQL DATERANGE lookup (~1-5ms) and HTTP serialization.

## Parallelism

The `evaluate_batch` function uses **Rayon** to distribute evaluations across all available CPU cores. On a 16-thread machine, this means batch evaluations of 100K+ transactions achieve near-linear speedup compared to the sequential baseline.

## Running Benchmarks

```bash
cd tempus_core
cargo bench
```

Results are saved to `tempus_core/target/criterion/` with HTML reports.
