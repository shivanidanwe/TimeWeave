import os
import math
import numpy as np
import pandas as pd
import joblib
from typing import Dict, Any, List, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score

MODEL_FILE = os.path.join(os.path.dirname(__file__), "model.joblib")

CATEGORY_BASELINES = {
    "Study": 60,
    "Work": 90,
    "Personal": 45,
    "Health": 45,
    "Other": 30
}

PRIORITY_MULTIPLIERS = {
    "Low": 0.85,
    "Medium": 1.0,
    "High": 1.25,
    "Critical": 1.5
}

ENERGY_MULTIPLIERS = {
    "Low": 0.9,
    "Medium": 1.0,
    "High": 1.2
}

CATEGORICAL_FEATURES = ["category", "priority", "energy_requirement", "flexibility"]
NUMERICAL_FEATURES = ["user_estimated_minutes", "word_count", "day_of_week", "hour_of_day", "has_dependencies"]

class DurationModel:
    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self.version = "1.0.0"
        self.training_samples = 0
        self.mae = 0.0
        self.r2 = 0.0
        self.load_if_exists()

    def calculate_baseline(self, task: Dict[str, Any]) -> Tuple[int, List[str]]:
        category = task.get("category", "Work")
        priority = task.get("priority", "Medium")
        energy = task.get("energy_requirement", "Medium")
        user_est = task.get("user_estimated_minutes")

        base = CATEGORY_BASELINES.get(category, 60)
        p_mult = PRIORITY_MULTIPLIERS.get(priority, 1.0)
        e_mult = ENERGY_MULTIPLIERS.get(energy, 1.0)

        calc = base * p_mult * e_mult

        explanations = [
            f"Base duration for '{category}': {base} mins",
            f"Priority '{priority}' factor: {p_mult:.2f}x",
            f"Energy requirement '{energy}' factor: {e_mult:.2f}x"
        ]

        if user_est and user_est > 0:
            final_mins = int(round(0.6 * user_est + 0.4 * calc))
            explanations.append(f"Blended with your initial estimate ({user_est}m)")
        else:
            final_mins = int(round(calc))

        final_mins = max(15, min(480, final_mins))
        return final_mins, explanations

    def predict(self, task: Dict[str, Any], user_history_count: int = 0) -> Dict[str, Any]:
        baseline_mins, baseline_reasons = self.calculate_baseline(task)

        # If model is not trained or user has fewer than 5 completed tasks, use baseline
        if self.pipeline is None or user_history_count < 5:
            return {
                "predicted_minutes": baseline_mins,
                "baseline_minutes": baseline_mins,
                "confidence_lower": max(15, int(baseline_mins * 0.8)),
                "confidence_upper": int(baseline_mins * 1.25),
                "prediction_source": "baseline",
                "model_version": "baseline-heuristic-v1",
                "explanations": baseline_reasons
            }

        # Prepare feature vector for ML pipeline
        try:
            df = self._task_to_df(task)
            pred = float(self.pipeline.predict(df)[0])
            pred_mins = max(15, min(480, int(round(pred))))

            # Estimate confidence interval using ensemble tree variance
            rf = self.pipeline.named_steps["regressor"]
            transformed = self.pipeline.named_steps["preprocessor"].transform(df)
            tree_preds = [tree.predict(transformed)[0] for tree in rf.estimators_]
            std_err = float(np.std(tree_preds)) if len(tree_preds) > 1 else 10.0

            lower = max(15, int(round(pred_mins - 1.96 * std_err)))
            upper = int(round(pred_mins + 1.96 * std_err))

            reasons = [
                f"Personalized ML estimate based on your past {user_history_count} completed tasks",
                f"Historical patterns for {task.get('category', 'category')} tasks with {task.get('priority', 'medium')} priority",
                f"Std deviation across model trees: ±{int(round(std_err))} mins"
            ]

            return {
                "predicted_minutes": pred_mins,
                "baseline_minutes": baseline_mins,
                "confidence_lower": lower,
                "confidence_upper": upper,
                "prediction_source": "ml_personalized",
                "model_version": self.version,
                "explanations": reasons
            }
        except Exception as e:
            # Fallback gracefully to baseline if pipeline evaluation fails
            return {
                "predicted_minutes": baseline_mins,
                "baseline_minutes": baseline_mins,
                "confidence_lower": max(15, int(baseline_mins * 0.8)),
                "confidence_upper": int(baseline_mins * 1.25),
                "prediction_source": "baseline_fallback",
                "model_version": "baseline-fallback",
                "explanations": baseline_reasons + [f"Fallback due to: {str(e)}"]
            }

    def train(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        if len(records) < 5:
            return {
                "status": "insufficient_data",
                "message": f"Requires at least 5 completed tasks to train personalized model. Received: {len(records)}",
                "trained": False
            }

        df = pd.DataFrame([self._record_to_features(r) for r in records])
        X = df.drop(columns=["actual_duration_minutes"])
        y = df["actual_duration_minutes"]

        preprocessor = ColumnTransformer(
            transformers=[
                ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
                ("num", StandardScaler(), NUMERICAL_FEATURES)
            ]
        )

        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", RandomForestRegressor(n_estimators=60, random_state=42, min_samples_split=2))
        ])

        pipeline.fit(X, y)
        preds = pipeline.predict(X)
        mae = float(mean_absolute_error(y, preds))
        r2 = float(r2_score(y, preds)) if len(records) > 2 else 0.0

        self.pipeline = pipeline
        self.training_samples = len(records)
        self.mae = round(mae, 2)
        self.r2 = round(r2, 2)
        self.version = f"1.0.{len(records)}"

        self.save()

        return {
            "status": "success",
            "trained": True,
            "samples": len(records),
            "mae": self.mae,
            "r2": self.r2,
            "version": self.version
        }

    def _task_to_df(self, task: Dict[str, Any]) -> pd.DataFrame:
        row = self._record_to_features(task)
        if "actual_duration_minutes" in row:
            del row["actual_duration_minutes"]
        return pd.DataFrame([row])

    def _record_to_features(self, r: Dict[str, Any]) -> Dict[str, Any]:
        title = str(r.get("title", ""))
        desc = str(r.get("description", ""))
        word_count = len((title + " " + desc).split())

        user_est = r.get("user_estimated_minutes")
        if user_est is None or user_est <= 0:
            user_est = CATEGORY_BASELINES.get(r.get("category", "Work"), 60)

        day_of_week = int(r.get("day_of_week", 2)) # Default Tuesday
        hour_of_day = int(r.get("hour_of_day", 10)) # Default 10 AM
        has_deps = 1 if r.get("dependencies") or r.get("has_dependencies") else 0

        res = {
            "category": r.get("category", "Work"),
            "priority": r.get("priority", "Medium"),
            "energy_requirement": r.get("energy_requirement", "Medium"),
            "flexibility": r.get("flexibility", "Flexible"),
            "user_estimated_minutes": float(user_est),
            "word_count": float(word_count),
            "day_of_week": float(day_of_week),
            "hour_of_day": float(hour_of_day),
            "has_dependencies": float(has_deps)
        }

        if "actual_duration_minutes" in r and r["actual_duration_minutes"] is not None:
            res["actual_duration_minutes"] = float(r["actual_duration_minutes"])

        return res

    def save(self):
        try:
            joblib.dump({
                "pipeline": self.pipeline,
                "training_samples": self.training_samples,
                "mae": self.mae,
                "r2": self.r2,
                "version": self.version
            }, MODEL_FILE)
        except Exception as e:
            print("Failed to save model:", e)

    def load_if_exists(self):
        if os.path.exists(MODEL_FILE):
            try:
                data = joblib.load(MODEL_FILE)
                self.pipeline = data.get("pipeline")
                self.training_samples = data.get("training_samples", 0)
                self.mae = data.get("mae", 0.0)
                self.r2 = data.get("r2", 0.0)
                self.version = data.get("version", "1.0.0")
            except Exception as e:
                print("Failed to load model:", e)

model = DurationModel()
