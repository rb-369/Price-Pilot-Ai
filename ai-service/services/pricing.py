"""
Price Optimization Engine
Considers: competitor prices, demand signals, stock levels, margin constraints
"""
import numpy as np
from typing import List, Dict, Optional


def optimize_price(
    product: Dict,
    competitor_prices: List[Dict],
    demand_signals: List[Dict],
) -> Dict:
    """
    Calculate optimal price considering multiple factors:
    1. Competitor price positioning
    2. Demand elasticity
    3. Stock pressure
    4. Minimum margin constraint
    """
    current_price = product.get("currentPrice", 0)
    base_cost = product.get("baseCost", 0)
    min_margin = product.get("minMargin", 0.1)
    stock_level = product.get("stockLevel", 100)
    reorder_threshold = product.get("reorderThreshold", 20)

    if current_price == 0 or base_cost == 0:
        return {
            "recommendedPrice": current_price,
            "reason": "Insufficient pricing data to generate recommendation.",
            "revenueImpact": 0,
            "confidenceScore": 0.1,
        }

    # === 1. Competitor Analysis ===
    competitor_factor = 0.0
    competitor_context = ""
    if competitor_prices:
        active_prices = [cp["price"] for cp in competitor_prices if cp.get("inStock", True)]
        out_of_stock = [cp for cp in competitor_prices if not cp.get("inStock", True)]

        if active_prices:
            avg_comp = np.mean(active_prices)
            min_comp = np.min(active_prices)
            max_comp = np.max(active_prices)

            # Position relative to competitors
            price_ratio = current_price / avg_comp if avg_comp > 0 else 1.0

            if price_ratio > 1.1:
                competitor_factor = -0.05  # We're too expensive
                competitor_context = f"priced {((price_ratio - 1) * 100):.1f}% above competitor average (₹{avg_comp:.0f})"
            elif price_ratio < 0.9:
                competitor_factor = 0.04  # We can increase
                competitor_context = f"priced {((1 - price_ratio) * 100):.1f}% below competitor average — room to increase"
            else:
                competitor_context = "competitively priced with market"

        if out_of_stock:
            competitor_factor += 0.03 * len(out_of_stock)
            oos_names = ", ".join([cp["name"] for cp in out_of_stock[:3]])
            competitor_context += f". {oos_names} out of stock — demand capture opportunity"

    # === 2. Demand Signal Analysis ===
    demand_factor = 0.0
    demand_context = ""
    if demand_signals:
        recent_scores = [ds.get("compositeDemandScore", 0.5) for ds in demand_signals[:7]]
        older_scores = [ds.get("compositeDemandScore", 0.5) for ds in demand_signals[7:14]] if len(demand_signals) > 7 else recent_scores

        avg_recent = np.mean(recent_scores)
        avg_older = np.mean(older_scores)

        demand_change = (avg_recent - avg_older) / max(avg_older, 0.01)

        if demand_change > 0.1:
            demand_factor = min(0.08, demand_change * 0.4)
            demand_context = f"demand rising {(demand_change * 100):.1f}% week-over-week"
        elif demand_change < -0.1:
            demand_factor = max(-0.06, demand_change * 0.3)
            demand_context = f"demand declining {(abs(demand_change) * 100):.1f}% week-over-week"
        else:
            demand_context = "demand stable"

    # === 3. Stock Pressure ===
    stock_factor = 0.0
    stock_context = ""
    stock_ratio = stock_level / max(reorder_threshold, 1)

    if stock_ratio < 1.0:
        stock_factor = 0.05  # Low stock → increase price
        stock_context = f"low stock ({stock_level} units, below reorder threshold)"
    elif stock_ratio > 5.0:
        stock_factor = -0.04  # Overstock → decrease price
        stock_context = f"overstocked ({stock_level} units, {stock_ratio:.1f}x reorder level)"
    else:
        stock_context = f"healthy stock levels ({stock_level} units)"

    # === 4. Combined Optimization ===
    total_adjustment = competitor_factor + demand_factor + stock_factor
    total_adjustment = np.clip(total_adjustment, -0.15, 0.15)  # Cap at ±15%

    recommended_price = current_price * (1 + total_adjustment)

    # Enforce minimum margin
    min_price = base_cost * (1 + min_margin)
    if recommended_price < min_price:
        recommended_price = min_price

    recommended_price = round(recommended_price)

    # Calculate expected revenue impact
    # Simple elasticity model: price increase reduces volume, price decrease increases volume
    elasticity = -1.5  # Price elasticity of demand
    price_change_pct = (recommended_price - current_price) / current_price
    volume_change_pct = price_change_pct * elasticity
    revenue_impact = ((1 + price_change_pct) * (1 + volume_change_pct) - 1) * 100

    # Confidence score
    data_points = len(competitor_prices) + len(demand_signals)
    confidence = min(0.95, 0.4 + data_points * 0.01 + (0.1 if competitor_prices else 0) + (0.1 if demand_signals else 0))

    # Build reason string
    factors = []
    if competitor_context:
        factors.append(competitor_context)
    if demand_context:
        factors.append(demand_context)
    if stock_context:
        factors.append(stock_context)

    direction = "Increase" if recommended_price > current_price else "Decrease" if recommended_price < current_price else "Maintain"
    change_pct = abs(price_change_pct * 100)

    reason = f"{direction} price by {change_pct:.1f}% to ₹{recommended_price}"
    if factors:
        reason += f" — {'; '.join(factors)}."
    reason += f" Expected revenue impact: {revenue_impact:+.1f}%."

    return {
        "recommendedPrice": recommended_price,
        "reason": reason,
        "revenueImpact": round(revenue_impact, 1),
        "confidenceScore": round(confidence, 2),
        "priceChange": round(price_change_pct * 100, 1),
        "factors": {
            "competitorFactor": round(competitor_factor * 100, 1),
            "demandFactor": round(demand_factor * 100, 1),
            "stockFactor": round(stock_factor * 100, 1),
        },
    }


def suggest_promotion(product: Dict, demand_signals: List[Dict]) -> Dict:
    """
    Suggest promotional discount based on overstock and demand trends.
    """
    stock_level = product.get("stockLevel", 0)
    reorder_threshold = product.get("reorderThreshold", 20)
    current_price = product.get("currentPrice", 0)
    base_cost = product.get("baseCost", 0)

    stock_ratio = stock_level / max(reorder_threshold, 1)
    max_discount = max(0, ((current_price - base_cost) / current_price) - product.get("minMargin", 0.1))

    if stock_ratio < 2.0:
        return {"shouldPromote": False, "reason": "Stock levels don't warrant a promotion."}

    # Calculate demand trend
    demand_trend = 0
    if demand_signals:
        scores = [ds.get("compositeDemandScore", 0.5) for ds in demand_signals[:7]]
        demand_trend = np.mean(scores)

    if demand_trend > 0.6:
        return {"shouldPromote": False, "reason": "Demand is strong — no promotion needed."}

    # Calculate discount percentage
    severity = min(1.0, (stock_ratio - 2.0) / 5.0)
    discount_pct = min(max_discount * 100, severity * 25)
    discount_pct = round(max(5, discount_pct))
    promo_price = round(current_price * (1 - discount_pct / 100))

    return {
        "shouldPromote": True,
        "discountPercentage": discount_pct,
        "promoPrice": promo_price,
        "reason": f"Recommend {discount_pct}% discount (₹{promo_price}) to clear excess inventory. Stock is {stock_ratio:.1f}x above reorder level with {'weak' if demand_trend < 0.4 else 'moderate'} demand.",
        "expectedVolumeIncrease": round(discount_pct * 2.5),
    }
