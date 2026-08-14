"""
PricePilot AI — Evaluation Metrics Library
Shared statistical metrics used across all domain evaluators.
"""
import numpy as np
from typing import List, Union, Optional


def mae(y_true: List[float], y_pred: List[float]) -> float:
    """Mean Absolute Error."""
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    return float(np.mean(np.abs(y_true - y_pred)))


def mape(y_true: List[float], y_pred: List[float]) -> float:
    """Mean Absolute Percentage Error. Skips zeros in y_true to avoid division by zero."""
    y_true, y_pred = np.array(y_true, dtype=float), np.array(y_pred, dtype=float)
    mask = y_true != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def rmse(y_true: List[float], y_pred: List[float]) -> float:
    """Root Mean Square Error."""
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def r_squared(y_true: List[float], y_pred: List[float]) -> float:
    """Coefficient of determination (R²)."""
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    if ss_tot == 0:
        return 1.0 if ss_res == 0 else 0.0
    return float(1 - ss_res / ss_tot)


def directional_accuracy(y_true: List[float], y_pred: List[float], baseline: Optional[List[float]] = None) -> float:
    """
    Percentage of predictions where the direction (up/down/stable) matches ground truth.
    
    If baseline is provided, direction = sign(value - baseline).
    Otherwise, direction = sign of sequential differences.
    """
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    
    if baseline is not None:
        baseline = np.array(baseline)
        true_dir = np.sign(y_true - baseline)
        pred_dir = np.sign(y_pred - baseline)
    else:
        if len(y_true) < 2:
            return 100.0
        true_dir = np.sign(np.diff(y_true))
        pred_dir = np.sign(np.diff(y_pred))
    
    if len(true_dir) == 0:
        return 100.0
    return float(np.mean(true_dir == pred_dir) * 100)


def hit_rate_at_k(y_true: List[float], y_pred: List[float], tolerance_pct: float = 5.0) -> float:
    """
    Percentage of predictions within ±tolerance_pct% of the true value.
    """
    y_true, y_pred = np.array(y_true, dtype=float), np.array(y_pred, dtype=float)
    if len(y_true) == 0:
        return 100.0
    pct_error = np.abs((y_pred - y_true) / np.where(y_true != 0, y_true, 1.0)) * 100
    return float(np.mean(pct_error <= tolerance_pct) * 100)


def profit_accuracy(
    recommended_prices: List[float],
    actual_optimal_prices: List[float],
    costs: List[float],
) -> float:
    """
    Revenue impact accuracy: how close is the recommended margin to the actual optimal margin.
    Returns R² of (recommended_margin vs optimal_margin).
    """
    rec = np.array(recommended_prices, dtype=float)
    opt = np.array(actual_optimal_prices, dtype=float)
    cost = np.array(costs, dtype=float)
    
    rec_margin = (rec - cost) / np.where(rec != 0, rec, 1.0)
    opt_margin = (opt - cost) / np.where(opt != 0, opt, 1.0)
    
    return r_squared(opt_margin.tolist(), rec_margin.tolist())


def classification_accuracy(y_true: List[str], y_pred: List[str]) -> float:
    """Simple classification accuracy for categorical predictions (e.g., trend direction)."""
    if not y_true:
        return 100.0
    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    return float(correct / len(y_true) * 100)


def calibration_score(confidences: List[float], accuracies: List[bool]) -> float:
    """
    Calibration: are higher-confidence predictions actually more accurate?
    Returns Spearman rank correlation between confidence and accuracy.
    Positive = well-calibrated, negative = anti-calibrated.
    """
    from scipy.stats import spearmanr
    if len(confidences) < 5:
        return 0.0
    corr, _ = spearmanr(confidences, [1.0 if a else 0.0 for a in accuracies])
    return float(corr) if not np.isnan(corr) else 0.0
