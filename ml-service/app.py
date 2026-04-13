"""
Student Performance ML API Service
FastAPI server providing ML prediction, training, and analytics endpoints.
"""

import os
import io
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from train_model import (
    run_training, load_and_preprocess, derive_grade,
    get_feature_importance, FEATURE_COLS, MODEL_DIR, DATA_DIR
)

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Student Performance ML API",
    description="ML service for student performance prediction and analytics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
class StudentFeatures(BaseModel):
    attendance: float
    study_hours: float
    internal_marks: float
    prev_marks: float
    assignment_score: float
    stream: str = "Science"
    science_type: str = ""
    physics: float = 0
    chemistry: float = 0
    maths: float = 0
    biology: float = 0
    accounts: float = 0
    business_studies: float = 0
    economics: float = 0
    history: float = 0
    political_science: float = 0
    geography: float = 0
    participation: float
    test_avg: float
    backlogs: float


class PredictionResponse(BaseModel):
    predicted_marks: float
    grade: str
    model_used: str

    model_config = {
        "protected_namespaces": ()
    }


class BatchPredictionItem(BaseModel):
    student_id: Optional[str] = None
    features: StudentFeatures


class BatchPredictionRequest(BaseModel):
    students: List[BatchPredictionItem]


# ---------------------------------------------------------------------------
# Helper: Load saved model artifacts
# ---------------------------------------------------------------------------
def load_model_artifacts():
    """Load the best model, scaler, and feature names from disk."""
    try:
        best_name = joblib.load(os.path.join(MODEL_DIR, "best_model_name.pkl"))
        safe_name = best_name.lower().replace(" ", "_")
        model = joblib.load(os.path.join(MODEL_DIR, f"{safe_name}.pkl"))
        scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
        feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
        return model, scaler, feature_names, best_name
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Call /train first."
        )


def build_feature_vector(feature_dict, feature_names):
    """Build a feature vector from a dict, handling one-hot encoded columns."""
    feature_vector = []
    for f in feature_names:
        if f in feature_dict:
            feature_vector.append(feature_dict[f])
        elif f.startswith('stream_'):
            # One-hot encoded stream column
            feature_vector.append(1.0 if feature_dict.get('stream') == f.replace('stream_', '') else 0.0)
        elif f.startswith('science_type_'):
            # One-hot encoded science_type column
            feature_vector.append(1.0 if feature_dict.get('science_type') == f.replace('science_type_', '') else 0.0)
        elif f.startswith('subjects_'):
            # Legacy one-hot encoded subjects column (backward compat)
            feature_vector.append(0.0)
        else:
            feature_vector.append(0)
    return feature_vector


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Student Performance ML API"}


@app.post("/train")
async def train_models():
    """Train all models on the dataset and return comparison metrics."""
    try:
        result = run_training()
        return {
            "success": True,
            "message": "Models trained successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/predict", response_model=PredictionResponse)
async def predict_single(features: StudentFeatures):
    """Predict marks for a single student."""
    model, scaler, feature_names, best_name = load_model_artifacts()

    # Build feature vector in correct order
    feature_dict = features.dict()
    feature_vector = build_feature_vector(feature_dict, feature_names)
    X = np.array([feature_vector])
    X_scaled = scaler.transform(X)

    prediction = model.predict(X_scaled)[0]
    # Clamp prediction to [0, 100]
    prediction = max(0, min(100, prediction))

    return PredictionResponse(
        predicted_marks=round(prediction, 2),
        grade=derive_grade(prediction),
        model_used=best_name
    )


@app.post("/predict-batch")
async def predict_batch(request: BatchPredictionRequest):
    """Predict marks for multiple students."""
    model, scaler, feature_names, best_name = load_model_artifacts()

    results = []
    for item in request.students:
        feature_dict = item.features.dict()
        feature_vector = build_feature_vector(feature_dict, feature_names)
        X = np.array([feature_vector])
        X_scaled = scaler.transform(X)

        prediction = model.predict(X_scaled)[0]
        prediction = max(0, min(100, prediction))

        results.append({
            "student_id": item.student_id,
            "predicted_marks": round(prediction, 2),
            "grade": derive_grade(prediction),
        })

    return {
        "success": True,
        "model_used": best_name,
        "predictions": results
    }


@app.get("/metrics")
async def get_metrics():
    """Get model comparison metrics (R², MAE, RMSE, cross-validation)."""
    try:
        metrics = joblib.load(os.path.join(MODEL_DIR, "metrics_summary.pkl"))
        return {"success": True, "metrics": metrics}
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="No metrics available. Train models first."
        )


@app.get("/feature-importance")
async def feature_importance():
    """Get feature importance from the Random Forest model."""
    try:
        rf_model = joblib.load(os.path.join(MODEL_DIR, "random_forest.pkl"))
        feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
        importance = get_feature_importance(rf_model, feature_names)
        return {"success": True, "feature_importance": importance}
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Random Forest model not found. Train models first."
        )


@app.post("/upload-csv")
async def upload_csv_and_retrain(file: UploadFile = File(...)):
    """Upload a new CSV dataset and retrain all models."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    try:
        contents = await file.read()
        # Save uploaded CSV
        upload_path = os.path.join(DATA_DIR, "student_performance_dataset_2000.csv")
        with open(upload_path, "wb") as f:
            f.write(contents)

        # Validate CSV has required columns
        df = pd.read_csv(io.BytesIO(contents))
        # Check for essential numeric columns (stream/science_type are categorical and may be encoded)
        essential_cols = [c for c in FEATURE_COLS if c not in ('stream', 'science_type')]
        missing_cols = [c for c in essential_cols if c not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required columns: {missing_cols}"
            )

        # Retrain models
        result = run_training(upload_path)

        return {
            "success": True,
            "message": f"Dataset uploaded ({len(df)} rows) and models retrained",
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload/retrain failed: {str(e)}")


@app.get("/dataset-stats")
async def get_dataset_stats():
    """Get basic statistics about the current dataset."""
    csv_path = os.path.join(DATA_DIR, "student_performance_dataset_2000.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = pd.read_csv(csv_path)
    if "student_id" in df.columns:
        df = df.drop(columns=["student_id"])

    stats = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        stats[col] = {
            "mean": round(float(df[col].mean()), 2),
            "median": round(float(df[col].median()), 2),
            "std": round(float(df[col].std()), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
        }

    # Grade distribution based on final_marks
    if "final_marks" in df.columns:
        grades = df["final_marks"].apply(derive_grade)
        grade_dist = grades.value_counts().to_dict()
    else:
        grade_dist = {}

    return {
        "success": True,
        "total_students": len(df),
        "column_stats": stats,
        "grade_distribution": grade_dist,
    }


if __name__ == "__main__":
    import uvicorn
    # Auto-train on startup if models don't exist
    if not os.path.exists(os.path.join(MODEL_DIR, "best_model_name.pkl")):
        print("No trained models found. Training now...")
        run_training()
    uvicorn.run(app, host="0.0.0.0", port=5001)
