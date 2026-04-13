"""
Student Performance ML Training Module
Trains Random Forest (primary), Linear Regression, and Decision Tree models.
Performs data preprocessing, train-test split, cross-validation, and model comparison.
"""

import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FEATURE_COLS = [
    "attendance", "study_hours", "internal_marks", "prev_marks",
    "assignment_score", "stream", "science_type",
    "physics", "chemistry", "maths", "biology",
    "accounts", "business_studies", "economics",
    "history", "political_science", "geography",
    "participation", "test_avg", "backlogs"
]
TARGET_COL = "final_marks"
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..")


def derive_grade(marks: float) -> str:
    """Derive letter grade from predicted marks."""
    if marks >= 85:
        return "A"
    elif marks >= 70:
        return "B"
    elif marks >= 50:
        return "C"
    else:
        return "Fail"


def load_and_preprocess(csv_path: str | None = None) -> tuple:
    """
    Load the dataset and preprocess:
    - Handle missing values (median imputation for numerics)
    - Separate features and target
    - Scale features with StandardScaler
    Returns (X_scaled, y, scaler, feature_names)
    """
    if csv_path is None:
        csv_path = os.path.join(DATA_DIR, "student_performance_dataset_2000.csv")

    df = pd.read_csv(csv_path)

    # Drop student_id if present (not a feature)
    if "student_id" in df.columns:
        df = df.drop(columns=["student_id"])

    # Drop sleep_hours if still present in old datasets
    if "sleep_hours" in df.columns:
        df = df.drop(columns=["sleep_hours"])

    # Drop old subjects column if present (replaced by stream/science_type)
    if "subjects" in df.columns:
        df = df.drop(columns=["subjects"])

    # Handle missing values – fill numeric cols with median
    for col in df.select_dtypes(include=[np.number]).columns:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)

    # Fill missing categorical values
    if "stream" in df.columns:
        df["stream"].fillna("Science", inplace=True)
    if "science_type" in df.columns:
        df["science_type"].fillna("", inplace=True)

    # Encode any categorical columns (one-hot) – dataset is all numeric, but just in case
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    if TARGET_COL in cat_cols:
        cat_cols.remove(TARGET_COL)
    if cat_cols:
        df = pd.get_dummies(df, columns=cat_cols, drop_first=True)

    # Select features that exist in the dataframe
    available_features = [c for c in FEATURE_COLS if c in df.columns]
    # Also include any one-hot columns that were created
    extra_cols = [c for c in df.columns if c not in FEATURE_COLS and c != TARGET_COL]
    feature_names = available_features + extra_cols

    X = df[feature_names].values
    y = df[TARGET_COL].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, feature_names, df


def train_all_models(X, y, random_state=42):
    """
    Train three models, perform cross-validation, and return results.
    Returns dict of {model_name: {model, metrics, cv_scores}}
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )

    models = {
        "Random Forest": RandomForestRegressor(
            n_estimators=200, max_depth=15, min_samples_split=5,
            min_samples_leaf=2, random_state=random_state, n_jobs=-1
        ),
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(
            max_depth=10, min_samples_split=5,
            min_samples_leaf=2, random_state=random_state
        ),
    }

    results = {}
    for name, model in models.items():
        # Train
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # Metrics
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        # 5-fold cross-validation
        cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")

        results[name] = {
            "model": model,
            "r2": round(r2, 4),
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "cv_mean": round(cv_scores.mean(), 4),
            "cv_std": round(cv_scores.std(), 4),
            "y_test": y_test,
            "y_pred": y_pred,
        }

        print(f"\n{'='*50}")
        print(f"Model: {name}")
        print(f"  R² Score:     {r2:.4f}")
        print(f"  MAE:          {mae:.4f}")
        print(f"  RMSE:         {rmse:.4f}")
        print(f"  CV R² (mean): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    return results, X_train, X_test, y_train, y_test


def get_feature_importance(model, feature_names):
    """Extract feature importance from tree-based models."""
    if hasattr(model, "feature_importances_"):
        importance = model.feature_importances_
        feat_imp = sorted(
            zip(feature_names, importance), key=lambda x: x[1], reverse=True
        )
        return [{"feature": f, "importance": round(float(imp), 4)} for f, imp in feat_imp]
    return []


def save_models(results, scaler, feature_names):
    """Save the best model, all models, scaler, and feature names to disk."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Save scaler
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    # Save feature names
    joblib.dump(feature_names, os.path.join(MODEL_DIR, "feature_names.pkl"))

    # Save all models
    for name, data in results.items():
        safe_name = name.lower().replace(" ", "_")
        joblib.dump(data["model"], os.path.join(MODEL_DIR, f"{safe_name}.pkl"))

    # Determine and save best model info
    best_name = max(results, key=lambda k: results[k]["r2"])
    joblib.dump(best_name, os.path.join(MODEL_DIR, "best_model_name.pkl"))

    # Save metrics summary
    metrics_summary = {}
    for name, data in results.items():
        metrics_summary[name] = {
            "r2": data["r2"],
            "mae": data["mae"],
            "rmse": data["rmse"],
            "cv_mean": data["cv_mean"],
            "cv_std": data["cv_std"],
        }
    joblib.dump(metrics_summary, os.path.join(MODEL_DIR, "metrics_summary.pkl"))

    print(f"\n{'='*50}")
    print(f"Best model: {best_name} (R² = {results[best_name]['r2']:.4f})")
    print(f"All models saved to {MODEL_DIR}")

    return best_name


def run_training(csv_path=None):
    """Full training pipeline. Returns metrics summary."""
    print("Loading and preprocessing data...")
    X, y, scaler, feature_names, df = load_and_preprocess(csv_path)

    print(f"Dataset shape: {X.shape}")
    print(f"Features: {feature_names}")

    print("\nTraining models...")
    results, X_train, X_test, y_train, y_test = train_all_models(X, y)

    print("\nSaving models...")
    best_name = save_models(results, scaler, feature_names)

    # Build response
    metrics = {}
    for name, data in results.items():
        metrics[name] = {
            "r2": data["r2"],
            "mae": data["mae"],
            "rmse": data["rmse"],
            "cv_mean": data["cv_mean"],
            "cv_std": data["cv_std"],
        }

    feature_importance = get_feature_importance(
        results["Random Forest"]["model"], feature_names
    )

    return {
        "best_model": best_name,
        "metrics": metrics,
        "feature_importance": feature_importance,
        "dataset_rows": len(df) if df is not None else 0,
        "features_used": feature_names,
    }


if __name__ == "__main__":
    result = run_training()
    print("\n\nTraining Complete!")
    print(f"Best Model: {result['best_model']}")
    print(f"\nFeature Importance:")
    for fi in result["feature_importance"]:
        print(f"  {fi['feature']}: {fi['importance']}")
