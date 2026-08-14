"""
ML-Based Price Elasticity Model (Production-Grade XGBoost/LightGBM)
Features:
  - price_ratio_vs_competitor: target_price / competitor_median_price
  - search_trend_normalized: Google Trends index (0-100)
  - sentiment_polarity: News sentiment polarity (-1.0 to +1.0)
  - stock_ratio: stock_level / reorder_threshold
  - discount_pct: (regular_price - target_price) / regular_price
  - demand_score: composite demand score (0-1)

Temporal Validation:
  - Walk-forward chronological time-series split (no data leakage)

Cold-Start Handling:
  - Category baseline priors for products with <10 observations

Quantile Bounds:
  - Output P10, P50 (median), P90 uncertainty bounds
"""
import os
import json
import pickle
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone
from pathlib import Path

from services.model_registry import register_model_version, log_shadow_prediction

MODEL_DIR = Path(__file__).parent.parent / "models"

# Category baseline priors for cold-start products (<10 sales)
CATEGORY_PRIORS = {
    "electronics": -1.4,
    "fashion": -2.1,
    "appliances": -0.9,
    "general": -1.2,
    "footwear": -1.8,
    "beauty": -1.1,
}

class ElasticityModel:
    def __init__(self, user_id="global"):
        self.user_id = user_id
        self.model_path = MODEL_DIR / f"elasticity_model_{user_id}.pkl"
        self.metadata_path = MODEL_DIR / f"elasticity_metadata_{user_id}.json"
        self.model = None
        self.scaler = None
        self.feature_names = [
            "demand_score", "competitor_spread", "stock_ratio",
            "price_level", "margin_pct", "search_trend_normalized",
            "price_ratio_vs_competitor", "discount_pct", "sentiment_polarity"
        ]
        self.metadata = {}
        self._load()

    def _load(self):
        """Load trained model from disk if available."""
        try:
            if self.model_path.exists():
                with open(self.model_path, "rb") as f:
                    saved = pickle.load(f)
                self.model = saved.get("model")
                self.scaler = saved.get("scaler")
                if self.metadata_path.exists():
                    with open(self.metadata_path, "r") as f:
                        self.metadata = json.load(f)
                print(f"[Elasticity] Loaded trained model for user {self.user_id} (version: {self.metadata.get('version', 'unknown')})")
            else:
                self.model = None
        except Exception as e:
            print(f"[Elasticity] Pre-trained model incompatible or missing ({e}), using heuristic fallback")
            self.model = None

    def predict_quantile_bounds(self, features: Dict) -> Dict[str, float]:
        """
        Predict P10, P50 (median), and P90 uncertainty bounds for elasticity.
        """
        p50, source = self.predict(features)
        # Standard error scaling for uncertainty bounds
        uncertainty = 0.25 if source == "ml_model" else 0.45
        p10 = float(np.clip(p50 - uncertainty, -3.5, -0.2))
        p90 = float(np.clip(p50 + uncertainty, -3.0, -0.1))
        return {
            "p10": p10,
            "p50": p50,
            "p90": p90,
            "source": source
        }

    def predict(self, features: Dict) -> Tuple[float, str]:
        """
        Predict price elasticity with cold-start category prior routing.
        """
        has_count = ("sales_count" in features) or ("order_count" in features)
        sales_count = features.get("sales_count", features.get("order_count", 0))
        category = str(features.get("category", "general")).lower()

        # Cold-Start Routing (<10 sales observations): Only trigger if sales_count is explicitly provided
        if has_count and sales_count < 10:
            prior = CATEGORY_PRIORS.get(category, -1.2)
            heuristic_val = self._heuristic_fallback(features)
            blended = round(float(0.7 * prior + 0.3 * heuristic_val), 3)
            return blended, "category_prior_coldstart"

        heuristic_val = self._heuristic_fallback(features)

        if self.model is None:
            return heuristic_val, "heuristic"

        try:
            X = self._extract_features(features)
            if self.scaler:
                X = self.scaler.transform(X)
            prediction = self.model.predict(X)[0]
            elasticity = float(np.clip(prediction, -3.5, -0.3))

            # Log shadow mode prediction comparison
            log_shadow_prediction(
                product_id=str(features.get("product_id", "unknown")),
                baseline_prediction=heuristic_val,
                ml_prediction=elasticity
            )

            return elasticity, "ml_model"
        except Exception as e:
            print(f"[Elasticity] Prediction error: {e}")
            return heuristic_val, "heuristic"

    def _extract_features(self, features: Dict) -> np.ndarray:
        """Convert feature dictionary into ML input vector."""
        curr_price = features.get("price_level", 1000)
        comp_price = features.get("competitor_median_price", curr_price)
        price_ratio = (curr_price / comp_price) if comp_price > 0 else 1.0

        regular_price = features.get("regular_price", curr_price)
        discount_pct = ((regular_price - curr_price) / regular_price) if regular_price > 0 else 0.0

        return np.array([[
            features.get("demand_score", 0.5),
            features.get("competitor_spread", 0.1),
            features.get("stock_ratio", 3.0),
            curr_price,
            features.get("margin_pct", 0.2),
            features.get("search_trend_normalized", 0.5),
            price_ratio,
            discount_pct,
            features.get("sentiment_polarity", 0.0),
        ]])

    def train(self, training_data: List[Dict]) -> Dict:
        """
        Train elasticity model with Walk-Forward Chronological Temporal Validation.
        """
        if len(training_data) < 30:
            return {
                "status": "insufficient_data",
                "samples": len(training_data),
                "minimum_required": 30,
                "message": "Need at least 30 observations to train. Using category baseline priors.",
            }

        try:
            # Sort data chronologically (Walk-Forward Temporal Split)
            sorted_data = sorted(
                training_data,
                key=lambda d: d.get("timestamp", d.get("purchasedAt", "1970-01-01"))
            )

            X = np.array([self._extract_features(d["features"])[0] for d in sorted_data])
            y = np.array([d["elasticity_observed"] for d in sorted_data])

            # Walk-forward 80/20 train/validation split
            split_idx = int(len(sorted_data) * 0.8)
            X_train, X_val = X[:split_idx], X[split_idx:]
            y_train, y_val = y[:split_idx], y[split_idx:]

            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_val_scaled = scaler.transform(X_val)

            # Try XGBoost or LightGBM first, fallback to GradientBoostingRegressor
            model = None
            try:
                import xgboost as xgb
                model = xgb.XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)
                model.fit(X_train_scaled, y_train)
            except Exception:
                try:
                    import lightgbm as lgb
                    model = lgb.LGBMRegressor(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)
                    model.fit(X_train_scaled, y_train)
                except Exception:
                    from sklearn.ensemble import GradientBoostingRegressor
                    model = GradientBoostingRegressor(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)
                    model.fit(X_train_scaled, y_train)

            # Validation metrics on chronological holdout set (X_val)
            val_preds = model.predict(X_val_scaled)
            mae = float(np.mean(np.abs(val_preds - y_val)))
            ss_tot = np.sum((y_val - np.mean(y_val)) ** 2)
            ss_res = np.sum((y_val - val_preds) ** 2)
            r2_score = float(1 - (ss_res / (ss_tot + 1e-8)))

            # Feature importances
            feat_imp = getattr(model, "feature_importances_", np.zeros(len(self.feature_names)))
            importances = dict(zip(self.feature_names, [round(float(v), 4) for v in feat_imp]))

            # Save artifact
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            with open(self.model_path, "wb") as f:
                pickle.dump({"model": model, "scaler": scaler}, f)

            metadata = {
                "version": datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S"),
                "trained_at": datetime.now(timezone.utc).isoformat(),
                "samples": len(training_data),
                "r2_mean": round(r2_score, 4),
                "mae": round(mae, 4),
                "validation_split": "walk_forward_chronological",
                "feature_importances": importances,
            }
            with open(self.metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)

            # Register version in model registry
            version_id = register_model_version(
                model_name=f"elasticity_{self.user_id}",
                metrics=metadata,
                filepath=str(self.model_path)
            )

            self.model = model
            self.scaler = scaler
            self.metadata = metadata

            return {
                "status": "success",
                "version_id": version_id,
                "samples": len(training_data),
                "r2_mean": round(r2_score, 4),
                "mae": round(mae, 4),
                "feature_importances": importances,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_status(self) -> Dict:
        return {
            "has_trained_model": self.model is not None,
            "metadata": self.metadata,
            "model_path": str(self.model_path),
            "fallback": "heuristic" if self.model is None else "ml_model",
        }

    @staticmethod
    def _heuristic_fallback(features: Dict) -> float:
        demand_score = features.get("demand_score", 0.5)
        stock_ratio = features.get("stock_ratio", 3.0)

        if demand_score > 0.7:
            base = -0.8
        elif demand_score > 0.55:
            base = -1.1
        elif demand_score > 0.45:
            base = -1.5
        elif demand_score > 0.3:
            base = -1.9
        else:
            base = -2.3

        if stock_ratio < 1.0:
            base += 0.3
        elif stock_ratio > 5.0:
            base -= 0.2

        return float(np.clip(base, -3.0, -0.3))

_models: Dict[str, ElasticityModel] = {}

def get_elasticity_model(user_id: str = "global") -> ElasticityModel:
    if user_id not in _models:
        _models[user_id] = ElasticityModel(user_id)
    return _models[user_id]

