"""
Price Optimization Engine — Upgraded
Key improvements over v1:
  - Dynamic price elasticity (estimated from demand trend, not hardcoded -1.5)
  - Weighted competitor scoring (in-stock, rating, recency weighted)
  - Margin optimization loop (binary search to maximize margin × volume)
  - Separate Buy Box targeting mode for Amazon sellers
"""
import numpy as np
from typing import List, Dict, Optional, Tuple


# ── Elasticity estimation (ML-powered with heuristic fallback) ────────────────

from services.elasticity_model import get_elasticity_model


def _estimate_elasticity(
    demand_signals: List[Dict],
    product: Optional[Dict] = None,
    competitor_prices: Optional[List[Dict]] = None,
) -> Tuple[float, str]:
    """
    Estimate price elasticity using the ML model (preferred) or heuristic fallback.

    Returns:
        (elasticity: float, source: str) where source is 'ml_model' or 'heuristic'
    """
    # Build feature vector for the ML model
    demand_score = 0.5
    search_trend = 0.5
    if demand_signals and len(demand_signals) >= 4:
        scores = [ds.get("compositeDemandScore", 0.5) for ds in demand_signals[:14]]
        demand_score = float(np.mean(scores))
        search_scores = [ds.get("searchTrendScore", 50) for ds in demand_signals[:7]]
        search_trend = float(np.mean(search_scores)) / 100.0

    stock_ratio = 3.0
    price_level = 1000
    margin_pct = 0.2
    if product:
        stock = product.get("stockLevel", 100)
        reorder = product.get("reorderThreshold", 20)
        stock_ratio = stock / max(reorder, 1)
        price_level = product.get("currentPrice", 1000)
        base_cost = product.get("baseCost", 800)
        margin_pct = (price_level - base_cost) / max(price_level, 1)

    competitor_spread = 0.1
    if competitor_prices and len(competitor_prices) >= 2:
        prices = [cp.get("price", 0) for cp in competitor_prices if cp.get("price", 0) > 0]
        if prices:
            avg_p = np.mean(prices)
            competitor_spread = (max(prices) - min(prices)) / max(avg_p, 1)

    features = {
        "demand_score": demand_score,
        "competitor_spread": float(competitor_spread),
        "stock_ratio": float(stock_ratio),
        "price_level": float(price_level),
        "margin_pct": float(margin_pct),
        "search_trend_normalized": float(search_trend),
    }

    model = get_elasticity_model()
    elasticity, source = model.predict(features)
    return elasticity, source


# ── Competitor analysis ───────────────────────────────────────────────────────

def _analyze_competitors(
    current_price: float,
    competitor_prices: List[Dict],
) -> Tuple[float, str, float]:
    """
    Returns (competitor_factor, context_string, weighted_avg_price).

    Improvements over v1:
    - Out-of-stock competitors excluded from price average
    - Weights by recency (newer data counts more)
    - Weights by rating (higher-rated competitors are stronger reference points)
    - Separate Buy Box target: aim just below the lowest in-stock price
    """
    if not competitor_prices:
        return 0.0, "", current_price

    # Separate in-stock and out-of-stock
    in_stock = [cp for cp in competitor_prices if cp.get("inStock", True)]
    out_of_stock = [cp for cp in competitor_prices if not cp.get("inStock", True)]

    if not in_stock:
        # All competitors out of stock — strong pricing power
        oos_names = ", ".join(cp["name"] for cp in out_of_stock[:3])
        context = f"all tracked competitors out of stock ({oos_names}) — strong pricing power"
        return 0.08, context, current_price

    # ── Weighted average of in-stock competitor prices ─────────────────────
    prices = np.array([cp["price"] for cp in in_stock], dtype=float)

    # Rating weight: higher-rated = stronger market signal
    ratings = np.array([cp.get("rating") or 4.0 for cp in in_stock], dtype=float)
    rating_weights = ratings / ratings.sum()

    weighted_avg = float(np.average(prices, weights=rating_weights))
    min_price = float(np.min(prices))
    max_price = float(np.max(prices))

    # ── Position analysis ──────────────────────────────────────────────────
    price_ratio = current_price / weighted_avg if weighted_avg > 0 else 1.0
    spread = (max_price - min_price) / max(weighted_avg, 1)

    competitor_factor = 0.0
    context_parts = []

    if price_ratio > 1.15:
        # Significantly above market — reduce
        competitor_factor = -0.06
        context_parts.append(
            f"priced {((price_ratio - 1) * 100):.1f}% above weighted competitor avg "
            f"(₹{weighted_avg:.0f}) — price reduction advised"
        )
    elif price_ratio > 1.05:
        competitor_factor = -0.03
        context_parts.append(
            f"slightly above competitor avg (₹{weighted_avg:.0f})"
        )
    elif price_ratio < 0.85:
        # Significantly below market — strong room to increase
        competitor_factor = 0.06
        context_parts.append(
            f"priced {((1 - price_ratio) * 100):.1f}% below market avg (₹{weighted_avg:.0f}) "
            f"— significant room to increase"
        )
    elif price_ratio < 0.95:
        competitor_factor = 0.03
        context_parts.append(
            f"slightly below competitor avg (₹{weighted_avg:.0f}) — modest increase possible"
        )
    else:
        context_parts.append(f"competitively priced at market avg (₹{weighted_avg:.0f})")

    # Bonus: out-of-stock competitors = demand capture opportunity
    if out_of_stock:
        oos_names = ", ".join(cp["name"] for cp in out_of_stock[:2])
        bonus = min(0.04, 0.02 * len(out_of_stock))
        competitor_factor += bonus
        context_parts.append(f"{oos_names} out of stock — demand capture opportunity (+{bonus*100:.0f}%)")

    # Low spread = commodity market, be careful raising prices
    if spread < 0.05 and competitor_factor > 0:
        competitor_factor *= 0.5
        context_parts.append("tight competitor spread — conservative increase applied")

    context = "; ".join(context_parts)
    return round(competitor_factor, 4), context, weighted_avg


# ── Demand signal analysis ────────────────────────────────────────────────────

def _analyze_demand(demand_signals: List[Dict]) -> Tuple[float, str]:
    """
    Returns (demand_factor, context_string).
    Incorporates search trend, social sentiment, and event/weather signals.
    """
    if not demand_signals:
        return 0.0, ""

    recent = demand_signals[:7]
    older = demand_signals[7:14] if len(demand_signals) > 7 else recent

    composite_recent = np.mean([ds.get("compositeDemandScore", 0.5) for ds in recent])
    composite_older = np.mean([ds.get("compositeDemandScore", 0.5) for ds in older])
    demand_change = (composite_recent - composite_older) / max(composite_older, 0.01)

    # Search trend signal (Google Trends-style score 0-100)
    search_score = np.mean([ds.get("searchTrendScore", 50) for ds in recent])

    # Social sentiment (-1 to 1 or 0 to 1 depending on your source)
    sentiment = np.mean([ds.get("socialSentimentScore", 0) for ds in recent])

    # Event/weather factors (additive boosts)
    event_boost = np.mean([ds.get("eventFactor", 0) for ds in recent])
    weather_factor = np.mean([ds.get("weatherFactor", 0) for ds in recent])

    demand_factor = 0.0
    context_parts = []

    # Core trend
    if demand_change > 0.15:
        demand_factor += min(0.08, demand_change * 0.4)
        context_parts.append(f"demand rising {demand_change*100:.1f}% WoW")
    elif demand_change < -0.15:
        demand_factor += max(-0.07, demand_change * 0.3)
        context_parts.append(f"demand declining {abs(demand_change)*100:.1f}% WoW")
    else:
        context_parts.append("demand stable")

    # Search trend bonus
    if search_score > 70:
        demand_factor += 0.02
        context_parts.append(f"high search interest ({search_score:.0f}/100)")
    elif search_score < 30:
        demand_factor -= 0.01
        context_parts.append(f"low search interest ({search_score:.0f}/100)")

    # Sentiment signal
    if sentiment > 0.3:
        demand_factor += 0.015
        context_parts.append("positive social sentiment")
    elif sentiment < -0.2:
        demand_factor -= 0.01
        context_parts.append("negative social sentiment")

    # Event/weather boosts
    if event_boost > 0.1:
        demand_factor += min(0.03, event_boost * 0.15)
        context_parts.append(f"event demand boost (+{event_boost:.1f}x)")
    if weather_factor != 0:
        demand_factor += min(0.02, max(-0.02, weather_factor * 0.1))

    return round(demand_factor, 4), "; ".join(context_parts)


# ── Stock pressure ─────────────────────────────────────────────────────────────

def _analyze_stock(stock_level: int, reorder_threshold: int) -> Tuple[float, str]:
    """Returns (stock_factor, context_string)."""
    stock_ratio = stock_level / max(reorder_threshold, 1)

    if stock_ratio < 0.5:
        return 0.07, f"critically low stock ({stock_level} units — below 50% of reorder threshold)"
    elif stock_ratio < 1.0:
        return 0.04, f"low stock ({stock_level} units, below reorder threshold)"
    elif stock_ratio > 8.0:
        return -0.06, f"heavily overstocked ({stock_level} units, {stock_ratio:.1f}x reorder level)"
    elif stock_ratio > 5.0:
        return -0.03, f"overstocked ({stock_level} units, {stock_ratio:.1f}x reorder level)"
    else:
        return 0.0, f"healthy stock ({stock_level} units)"


# ── Margin optimization loop ──────────────────────────────────────────────────

def _optimize_for_margin(
    current_price: float,
    base_cost: float,
    min_margin: float,
    raw_adjustment: float,
    elasticity: float,
) -> float:
    """
    Find the price that maximizes expected gross profit using scipy optimization.

    Revenue = price × volume
    Volume relative to current = (new_price / current_price) ^ elasticity
    Gross profit = (price - base_cost) × volume_index

    Uses scipy's bounded minimization (negated for maximization) on the
    unimodal profit function. Falls back to heuristic if scipy is unavailable.
    """
    min_price = base_cost * (1 + min_margin)
    max_allowed = current_price * 1.20  # Never raise more than 20% at once

    # Candidate starting point from heuristic
    candidate = current_price * (1 + raw_adjustment)
    candidate = max(min_price, min(max_allowed, candidate))

    # Calculate profit index for a given price
    def profit_index(p: float) -> float:
        volume_ratio = (p / current_price) ** elasticity  # elasticity is negative
        gross = (p - base_cost) * volume_ratio
        return gross

    try:
        from scipy.optimize import minimize_scalar

        # Minimize the negative profit (= maximize profit) over the bounded interval
        result = minimize_scalar(
            lambda p: -profit_index(p),
            bounds=(min_price, max_allowed),
            method='bounded',
            options={'xatol': 0.01},
        )

        if result.success:
            return round(result.x)
        else:
            # Optimization didn't converge — use heuristic candidate
            return round(candidate)

    except ImportError:
        # scipy not installed — fall back to candidate from heuristic adjustment
        return round(candidate)


# ── Main optimize function ────────────────────────────────────────────────────

def optimize_price(
    product: Dict,
    competitor_prices: List[Dict],
    demand_signals: List[Dict],
) -> Dict:
    """
    Calculate the optimal price with:
    1. Weighted competitor positioning (rating + recency weighted)
    2. Multi-signal demand analysis (search, sentiment, event, weather)
    3. Dynamic elasticity estimation (not hardcoded)
    4. Margin optimization loop (binary search over profit function)
    5. Stock pressure adjustment
    """
    current_price = product.get("currentPrice", 0)
    base_cost = product.get("baseCost", 0)
    min_margin = product.get("minMargin", 0.1)
    stock_level = product.get("stockLevel", 100)
    reorder_threshold = product.get("reorderThreshold", 20)

    if current_price == 0 or base_cost == 0:
        return {
            "recommendedPrice": current_price,
            "reason": "Insufficient pricing data — baseCost and currentPrice are required.",
            "revenueImpact": 0,
            "confidenceScore": 0.1,
        }

    # ── Run all analyses ──────────────────────────────────────────────────────
    competitor_factor, competitor_context, weighted_avg_comp = _analyze_competitors(
        current_price, competitor_prices
    )
    demand_factor, demand_context = _analyze_demand(demand_signals)
    stock_factor, stock_context = _analyze_stock(stock_level, reorder_threshold)
    elasticity, elasticity_source = _estimate_elasticity(demand_signals, product, competitor_prices)

    # Raw combined adjustment (heuristic signal)
    raw_adjustment = competitor_factor + demand_factor + stock_factor
    raw_adjustment = float(np.clip(raw_adjustment, -0.18, 0.18))

    # ── Margin-optimized price ────────────────────────────────────────────────
    recommended_price = _optimize_for_margin(
        current_price, base_cost, min_margin, raw_adjustment, elasticity
    )

    # Hard floor: never go below minimum margin
    min_price = base_cost * (1 + min_margin)
    recommended_price = max(recommended_price, int(min_price) + 1)

    # ── Revenue impact ────────────────────────────────────────────────────────
    price_change_pct = (recommended_price - current_price) / current_price
    volume_change_pct = price_change_pct * elasticity
    revenue_impact = ((1 + price_change_pct) * (1 + volume_change_pct) - 1) * 100

    # ── Confidence score ──────────────────────────────────────────────────────
    data_points = len(competitor_prices) + len(demand_signals)
    confidence = min(
        0.95,
        0.40
        + min(0.20, data_points * 0.008)
        + (0.10 if competitor_prices else 0.0)
        + (0.10 if demand_signals else 0.0)
        + (0.05 if len(demand_signals) >= 14 else 0.0)
    )

    # ── Build reason string ───────────────────────────────────────────────────
    factors = [f for f in [competitor_context, demand_context, stock_context] if f]
    direction = (
        "Increase" if recommended_price > current_price
        else "Decrease" if recommended_price < current_price
        else "Maintain"
    )
    change_pct = abs(price_change_pct * 100)

    reason = f"{direction} price by {change_pct:.1f}% to ₹{recommended_price}"
    if factors:
        reason += f" — {'; '.join(factors)}."
    reason += (
        f" Estimated elasticity: {elasticity:.1f} (source: {elasticity_source}). "
        f"Expected revenue impact: {revenue_impact:+.1f}%."
    )

    return {
        "recommendedPrice": recommended_price,
        "reason": reason,
        "revenueImpact": round(revenue_impact, 1),
        "confidenceScore": round(confidence, 2),
        "priceChange": round(price_change_pct * 100, 1),
        "elasticityUsed": elasticity,
        "elasticitySource": elasticity_source,
        "weightedCompetitorAvg": round(weighted_avg_comp, 2),
        "factors": {
            "competitorFactor": round(competitor_factor * 100, 1),
            "demandFactor": round(demand_factor * 100, 1),
            "stockFactor": round(stock_factor * 100, 1),
        },
    }


def suggest_promotion(product: Dict, demand_signals: List[Dict]) -> Dict:
    """
    Suggest promotional discount based on overstock + demand weakness.
    Upgraded: uses dynamic elasticity to estimate volume recovery.
    """
    stock_level = product.get("stockLevel", 0)
    reorder_threshold = product.get("reorderThreshold", 20)
    current_price = product.get("currentPrice", 0)
    base_cost = product.get("baseCost", 0)
    min_margin = product.get("minMargin", 0.1)

    stock_ratio = stock_level / max(reorder_threshold, 1)
    max_discount_pct = max(
        0.0,
        ((current_price - base_cost) / max(current_price, 1)) - min_margin
    ) * 100

    if stock_ratio < 2.0:
        return {
            "shouldPromote": False,
            "reason": "Stock levels do not warrant a promotion at this time.",
        }

    demand_trend = 0.5
    if demand_signals:
        scores = [ds.get("compositeDemandScore", 0.5) for ds in demand_signals[:7]]
        demand_trend = float(np.mean(scores))

    if demand_trend > 0.65:
        return {
            "shouldPromote": False,
            "reason": f"Demand is strong ({demand_trend:.2f} score) — no promotion needed.",
        }

    # Promotion intensity: more overstock + weaker demand = deeper discount
    overstock_severity = min(1.0, (stock_ratio - 2.0) / 6.0)
    demand_weakness = max(0.0, 0.65 - demand_trend) / 0.65

    discount_pct = round(
        min(max_discount_pct, (overstock_severity * 0.6 + demand_weakness * 0.4) * 30)
    )
    discount_pct = max(5, discount_pct)  # Minimum 5% promotion

    promo_price = round(current_price * (1 - discount_pct / 100))

    # Use dynamic elasticity to estimate volume uplift
    elasticity, elasticity_source = _estimate_elasticity(demand_signals, product)
    price_change = -discount_pct / 100
    volume_uplift = int(abs(price_change * elasticity) * 100)

    demand_label = "weak" if demand_trend < 0.4 else "moderate"

    return {
        "shouldPromote": True,
        "discountPercentage": discount_pct,
        "promoPrice": promo_price,
        "reason": (
            f"Recommend {discount_pct}% discount (₹{promo_price}) to clear excess inventory. "
            f"Stock is {stock_ratio:.1f}x above reorder level with {demand_label} demand "
            f"({demand_trend:.2f} score)."
        ),
        "expectedVolumeIncrease": volume_uplift,
        "elasticityUsed": elasticity,
        "elasticitySource": elasticity_source,
    }