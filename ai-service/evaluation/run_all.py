"""
PricePilot AI — Master Evaluation Runner
Runs all 6 domain evaluators, generates a consolidated scorecard,
and outputs a markdown report + JSON results.
"""
import sys
import os
import json
import time
from datetime import datetime, timezone
from pathlib import Path

# Fix Windows console encoding for Unicode box-drawing characters
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


REPORT_DIR = Path(__file__).parent.parent / "evaluation_reports"


def _print_header():
    print()
    print("╔" + "═" * 66 + "╗")
    print("║" + "  PricePilot AI — Model Accuracy Evaluation Suite".center(66) + "║")
    print("╠" + "═" * 66 + "╣")
    print("║" + f"  Run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".ljust(66) + "║")
    print("╚" + "═" * 66 + "╝")
    print()


def _print_scorecard(all_results: dict):
    print()
    print("╔" + "═" * 66 + "╗")
    print("║" + "  PricePilot AI — Model Accuracy Scorecard".center(66) + "║")
    print("╠" + "═" * 43 + "╦" + "═" * 11 + "╦" + "═" * 9 + "╣")
    print("║" + " Domain".ljust(43) + "║" + " Score".center(11) + "║" + " Status".center(9) + "║")
    print("╠" + "═" * 43 + "╬" + "═" * 11 + "╬" + "═" * 9 + "╣")

    overall_scores = []

    for domain_key, result in all_results.items():
        name = result.get("domain", domain_key)
        score = result.get("aggregate", {}).get("overall_score",
                result.get("aggregate", {}).get("overall_accuracy_pct",
                result.get("accuracy_pct", 0)))
        passed = result.get("passed", False)

        overall_scores.append(score)

        if passed:
            status = "✅ PASS"
        elif score >= 70:
            status = "⚠️ WARN"
        else:
            status = "❌ FAIL"

        score_str = f"{score}%"
        print("║" + f" {name}".ljust(43) + "║" + f" {score_str}".center(11) + "║" + f" {status}".center(9) + "║")

    print("╠" + "═" * 43 + "╬" + "═" * 11 + "╬" + "═" * 9 + "╣")

    avg_score = round(sum(overall_scores) / len(overall_scores), 1) if overall_scores else 0
    all_passed = all(r.get("passed", False) for r in all_results.values())
    overall_status = "✅ PASS" if all_passed else ("⚠️ WARN" if avg_score >= 70 else "❌ FAIL")

    print("║" + " OVERALL".ljust(43) + "║" + f" {avg_score}%".center(11) + "║" + f" {overall_status}".center(9) + "║")
    print("╚" + "═" * 43 + "╩" + "═" * 11 + "╩" + "═" * 9 + "╝")
    print()


def _generate_markdown_report(all_results: dict, elapsed: float) -> str:
    """Generate a detailed markdown evaluation report."""
    lines = [
        "# PricePilot AI — Model Accuracy Evaluation Report",
        "",
        f"> Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"> Total runtime: {elapsed:.1f}s",
        "",
        "---",
        "",
    ]

    # Summary table
    lines.append("## Summary Scorecard")
    lines.append("")
    lines.append("| Domain | Score | Status | Key Metric |")
    lines.append("|--------|-------|--------|------------|")

    for domain_key, result in all_results.items():
        name = result.get("domain", domain_key)
        agg = result.get("aggregate", {})
        score = agg.get("overall_score", agg.get("overall_accuracy_pct", result.get("accuracy_pct", 0)))
        passed = result.get("passed", False)
        status = "✅ Pass" if passed else ("⚠️ Warn" if score >= 70 else "❌ Fail")

        # Pick a key metric per domain
        key_metric = ""
        if domain_key == "pricing":
            key_metric = f"Dir. Accuracy: {agg.get('directional_accuracy_pct', 'N/A')}%"
        elif domain_key == "forecasting":
            key_metric = f"MAE: {agg.get('avg_mae', 'N/A')}, MAPE: {agg.get('avg_mape_pct', 'N/A')}%"
        elif domain_key == "demand_signals":
            key_metric = f"Isolation: {agg.get('isolation_accuracy_pct', 'N/A')}%"
        elif domain_key == "ab_testing":
            t1 = result.get("type_1_error", {})
            key_metric = f"FPR: {t1.get('false_positive_rate_pct', 'N/A')}%"
        elif domain_key == "chatbot":
            key_metric = f"Rule Acc: {agg.get('rule_accuracy_pct', 'N/A')}%"
        elif domain_key == "elasticity":
            tr = result.get("training_holdout", {})
            key_metric = f"R²: {tr.get('r2_score', 'N/A')}, MAE: {tr.get('mae', 'N/A')}"
        elif domain_key == "promotions":
            key_metric = f"Accuracy: {result.get('accuracy_pct', 'N/A')}%"

        lines.append(f"| {name} | {score}% | {status} | {key_metric} |")

    lines.append("")
    lines.append("---")
    lines.append("")

    # Quality gates
    lines.append("## Quality Gates")
    lines.append("")

    for domain_key, result in all_results.items():
        name = result.get("domain", domain_key)
        gates = result.get("quality_gates", {})
        if gates:
            lines.append(f"### {name}")
            lines.append("")
            for gate, passed in gates.items():
                icon = "✅" if passed else "❌"
                lines.append(f"- {icon} `{gate}`")
            lines.append("")

    # Detailed results per domain
    lines.append("---")
    lines.append("")
    lines.append("## Detailed Results")
    lines.append("")

    # Pricing scenarios
    if "pricing" in all_results:
        lines.append("### Pricing Recommendation Scenarios")
        lines.append("")
        lines.append("| Scenario | Current | Recommended | Expected | Correct |")
        lines.append("|----------|---------|-------------|----------|---------|")
        for s in all_results["pricing"].get("scenarios", []):
            icon = "✅" if s["direction_correct"] else "❌"
            lines.append(f"| {s['name']} | ₹{s['current_price']} | ₹{s['recommended_price']} | {s['expected_direction']} | {icon} |")
        lines.append("")

    # Forecasting patterns
    if "forecasting" in all_results:
        lines.append("### Forecast Accuracy by Pattern")
        lines.append("")
        lines.append("| Pattern | MAE | MAPE | Trend Accuracy |")
        lines.append("|---------|-----|------|----------------|")
        for pat, data in all_results["forecasting"].get("patterns", {}).items():
            lines.append(f"| {pat} | {data['mae']} | {data['mape']}% | {data['trend_accuracy']}% |")
        lines.append("")

    # Warnings
    warnings = []
    for domain_key, result in all_results.items():
        if result.get("warning"):
            warnings.append(f"- **{result.get('domain', domain_key)}**: {result['warning']}")

    if warnings:
        lines.append("---")
        lines.append("")
        lines.append("## ⚠️ Warnings")
        lines.append("")
        lines.extend(warnings)
        lines.append("")

    return "\n".join(lines)


def run_all(skip_chatbot: bool = False, skip_forecasting: bool = False) -> dict:
    """
    Run all evaluation domains and produce a scorecard.
    
    Args:
        skip_chatbot: Skip chatbot evaluation (requires LLM API key)
        skip_forecasting: Skip forecasting (requires Prophet/statsmodels)
    """
    _print_header()
    start = time.time()
    all_results = {}

    # ── 1. Pricing ────────────────────────────────────────────────────────────
    print("🏷️  [1/6] Evaluating Pricing Recommendations...", end=" ", flush=True)
    t0 = time.time()
    try:
        from evaluation.eval_pricing import evaluate_pricing, evaluate_promotions
        all_results["pricing"] = evaluate_pricing()
        all_results["promotions"] = evaluate_promotions()
        print(f"Done ({time.time()-t0:.1f}s)")
    except Exception as e:
        print(f"ERROR: {e}")
        all_results["pricing"] = {"domain": "Pricing Recommendations", "passed": False, "aggregate": {"overall_score": 0}, "error": str(e)}

    # ── 2. Forecasting ────────────────────────────────────────────────────────
    if not skip_forecasting:
        print("📈 [2/6] Evaluating Demand Forecasting...", end=" ", flush=True)
        t0 = time.time()
        try:
            from evaluation.eval_forecasting import evaluate_forecasting
            all_results["forecasting"] = evaluate_forecasting()
            print(f"Done ({time.time()-t0:.1f}s)")
        except Exception as e:
            print(f"ERROR: {e}")
            all_results["forecasting"] = {"domain": "Demand Forecasting", "passed": False, "aggregate": {"overall_score": 0}, "error": str(e)}
    else:
        print("📈 [2/6] Skipping Demand Forecasting (--skip-forecasting)")
        all_results["forecasting"] = {"domain": "Demand Forecasting", "passed": True, "aggregate": {"overall_score": -1}, "skipped": True}

    # ── 3. Demand Signals ─────────────────────────────────────────────────────
    print("📡 [3/6] Evaluating Demand Signal Analysis...", end=" ", flush=True)
    t0 = time.time()
    try:
        from evaluation.eval_demand_signals import evaluate_demand_signals
        all_results["demand_signals"] = evaluate_demand_signals()
        print(f"Done ({time.time()-t0:.1f}s)")
    except Exception as e:
        print(f"ERROR: {e}")
        all_results["demand_signals"] = {"domain": "Demand Signal Analysis", "passed": False, "aggregate": {"overall_score": 0}, "error": str(e)}

    # ── 4. A/B Testing ────────────────────────────────────────────────────────
    print("🧪 [4/6] Evaluating A/B Testing Statistics...", end=" ", flush=True)
    t0 = time.time()
    try:
        from evaluation.eval_ab_testing import evaluate_ab_testing
        all_results["ab_testing"] = evaluate_ab_testing()
        print(f"Done ({time.time()-t0:.1f}s)")
    except Exception as e:
        print(f"ERROR: {e}")
        all_results["ab_testing"] = {"domain": "A/B Testing Statistical Validity", "passed": False, "aggregate": {"overall_score": 0}, "error": str(e)}

    # ── 5. Chatbot ────────────────────────────────────────────────────────────
    if not skip_chatbot:
        print("💬 [5/6] Evaluating Chatbot Accuracy...", end=" ", flush=True)
        t0 = time.time()
        try:
            from evaluation.eval_chatbot import evaluate_chatbot
            all_results["chatbot"] = evaluate_chatbot()
            print(f"Done ({time.time()-t0:.1f}s)")
        except Exception as e:
            print(f"ERROR: {e}")
            all_results["chatbot"] = {"domain": "Chatbot Accuracy", "passed": True, "aggregate": {"overall_score": -1}, "warning": f"Chatbot eval failed: {e}"}
    else:
        print("💬 [5/6] Skipping Chatbot Evaluation (--skip-chatbot)")
        all_results["chatbot"] = {"domain": "Chatbot Accuracy", "passed": True, "aggregate": {"overall_score": -1}, "skipped": True}

    # ── 6. Elasticity ─────────────────────────────────────────────────────────
    print("📉 [6/6] Evaluating Elasticity Model...", end=" ", flush=True)
    t0 = time.time()
    try:
        from evaluation.eval_elasticity import evaluate_elasticity
        all_results["elasticity"] = evaluate_elasticity()
        print(f"Done ({time.time()-t0:.1f}s)")
    except Exception as e:
        print(f"ERROR: {e}")
        all_results["elasticity"] = {"domain": "Elasticity Model Quality", "passed": False, "aggregate": {"overall_score": 0}, "error": str(e)}

    elapsed = time.time() - start

    # ── Print Scorecard ───────────────────────────────────────────────────────
    _print_scorecard(all_results)

    # ── Generate Reports ──────────────────────────────────────────────────────
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # JSON results
    json_path = REPORT_DIR / f"eval_results_{timestamp}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"📄 JSON results: {json_path}")

    # Markdown report
    md_report = _generate_markdown_report(all_results, elapsed)
    md_path = REPORT_DIR / f"eval_report_{timestamp}.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_report)
    print(f"📋 Markdown report: {md_path}")

    # Also write a "latest" symlink-style copy
    latest_json = REPORT_DIR / "latest_results.json"
    latest_md = REPORT_DIR / "latest_report.md"
    with open(latest_json, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, default=str)
    with open(latest_md, "w", encoding="utf-8") as f:
        f.write(md_report)

    print(f"\n⏱️  Total runtime: {elapsed:.1f}s")

    # ── Exit code ─────────────────────────────────────────────────────────────
    all_passed = all(
        r.get("passed", False)
        for r in all_results.values()
        if not r.get("skipped", False)
    )
    if all_passed:
        print("✅ ALL EVALUATIONS PASSED")
    else:
        failed = [r.get("domain", k) for k, r in all_results.items() if not r.get("passed", False) and not r.get("skipped", False)]
        print(f"❌ FAILURES: {', '.join(failed)}")

    return all_results


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="PricePilot AI Model Accuracy Evaluation Suite")
    parser.add_argument("--skip-chatbot", action="store_true", help="Skip chatbot evaluation")
    parser.add_argument("--skip-forecasting", action="store_true", help="Skip forecasting evaluation")
    args = parser.parse_args()

    results = run_all(skip_chatbot=args.skip_chatbot, skip_forecasting=args.skip_forecasting)

    all_passed = all(
        r.get("passed", False)
        for r in results.values()
        if not r.get("skipped", False)
    )
    sys.exit(0 if all_passed else 1)
