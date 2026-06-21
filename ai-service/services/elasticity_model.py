"""
ML-Based Price Elasticity Model
Replaces the heuristic _estimate_elasticity() with a trained GradientBoostingRegressor.

Training data: historical price changes → volume/demand changes, extracted from
accepted/rejected PricingRecommendations and subsequent DemandSignal movements.

Falls back gracefully to the heuristic when:
  - No trained model exists
  - Fewer than 50 training observations
  - Model file is corrupted
"""
import os
import json
import pickle
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path


# Model persistence path
MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_PATH = MODEL_DIR / "elasticity_model.pkl"
METADATA_PATH = MODEL_DIR / "elasticity_metadata.json"


class ElasticityModel:
    """
    Gradient Boosting Regressor for price elasticity estimation.

    Features:
      - price_change_pct: % change from current price
      - demand_score: composite demand score (0-1)
      - competitor_spread: (max - min competitor price) / avg
      - stock_ratio: stock_level / reorder_threshold
      - category_encoded: one-hot or label encoded category

    Target:
      - elasticity: estimated from volume change after price change
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = [
            "demand_score", "competitor_spread", "stock_ratio",
            "price_level", "margin_pct", "search_trend_normalized",
        ]
        self.metadata = {}
        self._load()

    def _load(self):
        """Load trained model from disk if available."""
        try:
            if MODEL_PATH.exists():
                with open(MODEL_PATH, "rb") as f:
                    saved = pickle.load(f)
                self.model = saved.get("model")
                self.scaler = saved.get("scaler")
                if METADATA_PATH.exists():
                    with open(METADATA_PATH, "r") as f:
                        self.metadata = json.load(f)
                print(f"[Elasticity] Loaded trained model (version: {self.metadata.get('version', 'unknown')})")
            else:
                print("[Elasticity] No trained model found, using heuristic fallback")
        except Exception as e:
            print(f"[Elasticity] Failed to load model: {e}")
            self.model = None

    def predict(self, features: Dict) -> Tuple[float, str]:
        """
        Predict price elasticity.

        Args:
            features: dict with keys matching self.feature_names

        Returns:
            (elasticity: float, source: str)
            elasticity is typically negative (-0.5 to -3.0)
            source is "ml_model" or "heuristic"
        """
        if self.model is None:
            return self._heuristic_fallback(features), "heuristic"

        try:
            X = self._extract_features(features)
            if self.scaler:
                X = self.scaler.transform(X)
            prediction = self.model.predict(X)[0]
            # Clamp to valid range
            elasticity = float(np.clip(prediction, -3.0, -0.3))
            return elasticity, "ml_model"
        except Exception as e:
            print(f"[Elasticity] Prediction failed: {e}")
            return self._heuristic_fallback(features), "heuristic"

    def _extract_features(self, features: Dict) -> np.ndarray:
        """Convert feature dict to numpy array."""
        X = np.array([[
            features.get("demand_score", 0.5),
            features.get("competitor_spread", 0.1),
            features.get("stock_ratio", 3.0),
            features.get("price_level", 1000),
            features.get("margin_pct", 0.2),
            features.get("search_trend_normalized", 0.5),
        ]])
        return X

    def train(self, training_data: List[Dict]) -> Dict:
        """
        Train the elasticity model on historical feedback data.

        Args:
            training_data: List of observations, each with:
                - features: dict of input features
                - elasticity_observed: float (target)

        Returns:
            Training metrics (accuracy, R², sample size)
        """
        if len(training_data) < 30:
            return {
                "status": "insufficient_data",
                "samples": len(training_data),
                "minimum_required": 30,
                "message": "Need at least 30 feedback observations to train. Using heuristic.",
            }

        try:
            from sklearn.ensemble import GradientBoostingRegressor
            from sklearn.model_selection import cross_val_score
            from sklearn.preprocessing import StandardScaler

            # Prepare arrays
            X = np.array([self._extract_features(d["features"])[0] for d in training_data])
            y = np.array([d["elasticity_observed"] for d in training_data])

            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            # Train model
            model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
            )
            model.fit(X_scaled, y)

            # Cross-validation score
            cv_scores = cross_val_score(model, X_scaled, y, cv=min(5, len(training_data) // 5), scoring="r2")
            r2_mean = float(np.mean(cv_scores))
            r2_std = float(np.std(cv_scores))

            # Feature importance
            importances = dict(zip(self.feature_names, model.feature_importances_.tolist()))

            # Save model
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            with open(MODEL_PATH, "wb") as f:
                pickle.dump({"model": model, "scaler": scaler}, f)

            metadata = {
                "version": datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
                "trained_at": datetime.utcnow().isoformat(),
                "samples": len(training_data),
                "r2_mean": round(r2_mean, 4),
                "r2_std": round(r2_std, 4),
                "feature_importances": importances,
            }
            with open(METADATA_PATH, "w") as f:
                json.dump(metadata, f, indent=2)

            # Update in-memory model
            self.model = model
            self.scaler = scaler
            self.metadata = metadata

            return {
                "status": "success",
                "samples": len(training_data),
                "r2_mean": round(r2_mean, 4),
                "r2_std": round(r2_std, 4),
                "feature_importances": importances,
                "model_path": str(MODEL_PATH),
            }

        except ImportError:
            return {"status": "error", "message": "scikit-learn not installed"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_status(self) -> Dict:
        """Return current model status and metadata."""
        return {
            "has_trained_model": self.model is not None,
            "metadata": self.metadata,
            "model_path": str(MODEL_PATH),
            "fallback": "heuristic" if self.model is None else "ml_model",
        }

    @staticmethod
    def _heuristic_fallback(features: Dict) -> float:
        """
        Original heuristic elasticity estimation.
        Kept as fallback when ML model is unavailable.
        """
        demand_score = features.get("demand_score", 0.5)
        stock_ratio = features.get("stock_ratio", 3.0)

        # High demand → inelastic; low demand → elastic
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

        # Low stock → more inelastic (scarcity premium)
        if stock_ratio < 1.0:
            base += 0.3  # Less negative = more inelastic
        elif stock_ratio > 5.0:
            base -= 0.2  # More negative = more elastic

        return float(np.clip(base, -3.0, -0.3))


# Singleton instance
_model_instance: Optional[ElasticityModel] = None


def get_elasticity_model() -> ElasticityModel:
    """Get the singleton ElasticityModel instance."""
    global _model_instance
    if _model_instance is None:
        _model_instance = ElasticityModel()
    return _model_instance
