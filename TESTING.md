# Testing PricePilot

This document outlines how to run the automated test suites, performance benchmarks, and A/B testing framework for PricePilot.

## 1. Automated Test Suites

### Node.js Backend Tests (Jest)

The Node.js backend uses Jest and `mongodb-memory-server` to mock the database.

```bash
cd server
npm install
npm test
```

**Key test areas:**
- Authentication (`auth.test.js`)
- Product CRUD operations (`products.test.js`)
- AI recommendations loop (`aiController.test.js`)
- A/B Testing framework (`abTest.test.js`)

### Python AI Service Tests (Pytest)

The FastAPI Python service uses Pytest and `pytest-asyncio`.

```bash
cd ai-service
pip install -r requirements.txt
pytest
```

**Key test areas:**
- Data Pipeline & Fallbacks (`test_data_pipeline.py`)
- Pricing Engine Rules (`test_pricing.py`)
- Elasticity ML Model (`test_elasticity.py`)
- Forecasting Time-Series (`test_forecasting.py`)
- API Route Integrations (`test_routes.py`)

## 2. Performance Benchmarks & Load Testing

To evaluate the performance of the Python pricing engine under load, use the benchmarking script:

```bash
cd ai-service
python benchmarks/benchmark_pricing.py
```

This runs a local benchmark testing:
- **Throughput:** How many optimization requests the pricing engine can handle per second.
- **Latency:** Average time per pricing decision.
- **Bulk Processing:** Performance scaling for bulk pricing queries.

*Target Baseline:* < 50ms per pricing decision on standard hardware.

## 3. A/B Testing & Feedback Loop (Self-Improving AI)

PricePilot features a continuous feedback loop and A/B testing module.

### A/B Testing
When an A/B test is initiated (e.g. Control vs AI Recommended Price):
- Real-time views and conversions are logged to `/api/ab-tests/:id/record`.
- The `ABTest` model tracks statistical significance (Z-test/Chi-square) locally.
- When completed, the winner is automatically applied to the product.

### Self-Improving Elasticity Model
1. Every accepted or rejected recommendation is logged to `FeedbackLog`.
2. A cron job in the Node server (`scheduler.js`) runs weekly.
3. It bundles the `FeedbackLog` changes and queries the Python service `/api/retrain-elasticity`.
4. The Python service uses `scikit-learn` (GradientBoostingRegressor) to train a new elasticity curve.
5. The model is saved to `ai-service/models/elasticity_model.pkl`.

## 4. AI Model Accuracy Evaluation

PricePilot includes a comprehensive evaluation framework that measures model accuracy across **6 AI domains**.

### Quick Start

```bash
cd ai-service

# Run the FULL evaluation suite (all 6 domains)
python -m evaluation.run_all

# Skip chatbot eval (requires LLM_API_KEY) and forecasting (requires Prophet)
python -m evaluation.run_all --skip-chatbot --skip-forecasting
```

### Individual Domain Evaluators

```bash
# Pricing recommendation accuracy (15 scenarios + 10K fuzz tests)
python -m evaluation.eval_pricing

# Demand forecasting accuracy (4 synthetic patterns, walk-forward backtest)
python -m evaluation.eval_forecasting

# Demand signal scoring validation (isolation, composite, edge cases)
python -m evaluation.eval_demand_signals

# A/B testing statistical validity (Type I/II error, power analysis)
python -m evaluation.eval_ab_testing

# Chatbot accuracy (rule-based + LLM-as-judge when API key is set)
python -m evaluation.eval_chatbot

# Elasticity model quality (training, cold-start, stability, quantiles)
python -m evaluation.eval_elasticity
```

### Quality Gates (minimum thresholds to pass)

| Domain | Metric | Minimum |
|--------|--------|---------|
| Pricing | Directional accuracy | ≥ 85% |
| Pricing | Margin guardrail compliance | 100% |
| Forecasting | Trend direction accuracy | ≥ 80% |
| Forecasting | MAE (normalized) | < 0.15 |
| Demand Signals | Directional consistency | ≥ 90% |
| A/B Testing | Type I error rate | ≤ 7% |
| Chatbot | Rule-based accuracy | ≥ 70% |
| Elasticity | Holdout MAE | < 0.8 |

### Reports

After running the suite, reports are saved to `ai-service/evaluation_reports/`:
- `latest_results.json` — Full JSON results
- `latest_report.md` — Human-readable markdown report
- `eval_results_<timestamp>.json` — Timestamped archive
