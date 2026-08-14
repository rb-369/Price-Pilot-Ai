import os
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
REGISTRY_LOG_PATH = os.path.join(MODELS_DIR, "model_registry.json")
SHADOW_LOG_PATH = os.path.join(MODELS_DIR, "shadow_evaluations.jsonl")

os.makedirs(MODELS_DIR, exist_ok=True)

def register_model_version(model_name: str, metrics: Dict[str, Any], filepath: str) -> str:
    """Registers a model version with timestamp, metadata metrics, and artifact path."""
    version_id = f"{model_name}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    registry_data = []
    if os.path.exists(REGISTRY_LOG_PATH):
        try:
            with open(REGISTRY_LOG_PATH, 'r') as f:
                registry_data = json.load(f)
        except Exception:
            registry_data = []

    record = {
        "version_id": version_id,
        "model_name": model_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "filepath": filepath,
        "metrics": metrics
    }
    registry_data.append(record)

    with open(REGISTRY_LOG_PATH, 'w') as f:
        json.dump(registry_data, f, indent=2)

    return version_id

def log_shadow_prediction(product_id: str, baseline_prediction: float, ml_prediction: float, actual_demand: Optional[float] = None):
    """Logs shadow evaluation predictions comparing legacy baseline vs new ML predictions."""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "product_id": product_id,
        "baseline_prediction": baseline_prediction,
        "ml_prediction": ml_prediction,
        "actual_demand": actual_demand,
        "delta": abs(ml_prediction - baseline_prediction)
    }
    try:
        with open(SHADOW_LOG_PATH, 'a') as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"Shadow prediction logging warning: {e}")

def get_latest_model_metadata(model_name: str) -> Optional[Dict[str, Any]]:
    """Retrieves metadata of the latest registered model version."""
    if not os.path.exists(REGISTRY_LOG_PATH):
        return None
    try:
        with open(REGISTRY_LOG_PATH, 'r') as f:
            registry_data = json.load(f)
        matching = [m for m in registry_data if m.get("model_name") == model_name]
        if matching:
            return matching[-1]
    except Exception as e:
        print(f"Failed to read model registry: {e}")
    return None
