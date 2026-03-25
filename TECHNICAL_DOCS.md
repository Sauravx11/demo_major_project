# Technical Documentation: AI-Based Student Performance Analytics System

This document outlines the technical architecture, data flow, and inner workings of the Student Performance Analytics & Management System.

---

## 1. High-Level Architecture

The system follows a microservices-inspired architecture with a decoupled Machine Learning service, enabling scalability and separation of concerns.

- **Frontend (Client Layer)**: React 18 SPA built with Vite.
- **Backend (API Gateway & Logic)**: Node.js + Express.js handling authentication, routing, CRUD, and proxying ML requests.
- **Database (Data Layer)**: MongoDB storing persistent relational-like data in document format.
- **ML Service (Inference & Training Layer)**: Python + FastAPI providing scikit-learn model interfaces.

### 1.1 Diagram: Request Lifecycle (Predictions)
1. **Client** makes a request to `/api/predictions/predict-all` on Node Express server.
2. **Node Server** queries MongoDB for all student records.
3. **Node Server** maps data and posts it to Python FastAPI (`/predict-batch`).
4. **Python ML Service** loads the pickled scalers and Random Forest model, calculates predictions, rounds values, applies grades, and returns JSON.
5. **Node Server** applies business logic (smart recommendations engine), stores the results in MongoDB `predictions` collection.
6. **Node Server** responds to Client with saved predictions.

---

## 2. Machine Learning Pipeline Architecture
### Path: `ml-service/train_model.py` and `ml-service/app.py`

The ML module is designed to be fully dynamic, adapting to new data through CSV uploads.

### 2.1 Preprocessing Pipeline
- **Missing Value Handling**: Numeric fields are imputed using median values to handle incomplete datasets via `SimpleImputer`.
- **Feature Scaling**: Uses `StandardScaler` to normalize distributions (mean=0, std=1), crucial for convergence in distance-based models (Linear Regression).

### 2.2 Model Training Workflow
When `/train` is triggered:
1. Three models traverse a 5-fold cross-validation (`KFold(n_splits=5)`) to compute unbiased R² scores, Mean Absolute Error (MAE), and Root Mean Squared Error (RMSE).
2. **Models Trained**:
   - `RandomForestRegressor (n_estimators=200, max_depth=10)`: The robust ensemble primary model resistant to overfitting tabular data.
   - `LinearRegression()`: Serves as a baseline to measure if complex models are actually learning non-linear relationships.
   - `DecisionTreeRegressor (max_depth=5)`: Extracted for simpler hierarchical interpretation.
3. The model with the highest R² is designated as the `best_model` and its artifacts (`scaler.pkl`, `model.pkl`, `feature_names.pkl`) are serialized using `joblib`.

### 2.3 Feature Importance
Exclusive to Random Forest, `feature_importances_` are extracted, mapped to columns, scaled to a percentage, and served to the React frontend to visualize exactly *what factors* drive class success (e.g., Attendance vs Prev Marks).

---

## 3. Backend Architecture (Node.js/Express)
### Path: `backend/server.js` and `backend/routes/`

### 3.1 Authentication & Security
- **JWT (JSON Web Tokens)**: Used for stateless authentication.
- **Bcrypt**: Passwords are hashed (`genSalt(12)`) pre-save in the DB.
- **Role-Based Access Control (RBAC)**: Custom Express middleware functions (`protect` and `authorize('teacher')`) wrap sensitive endpoints to prevent privilege escalation.

### 3.2 Key Services
- **Students Service**: 
  - Supports efficient regex-based search, multi-field filtering, and MongoDB `skip/limit` pagination.
  - CSV parsing utilizing `multer` (multipart/form upload stream) and `csv-parser` to stream-process and bulk-upsert thousands of students efficiently via `Student.bulkWrite`.
- **Recommendations Engine**:
  - Found in `routes/predictions.js`. Evaluates student feature thresholds post-prediction (e.g., `<75% attendance` or `<5 hours sleep`) to dynamically generate targeted intervention advice arrays.
- **Analytics Service**:
  - Leverages MongoDB Advanced Aggregation (`$group`, `$bucket`) to dynamically compute grade distributions and feature averages rather than executing loops in Node runtime.

---

## 4. Frontend Architecture (React)
### Path: `frontend/src/`

- **Global State Management**: Context API (`AuthContext`) manages auth persistence avoiding Redux overhead.
- **API Interceptors**: Global Axios instance dynamically attaches authorization `Bearer` tokens to every request and universally catches `401 Unauthorized` errors to force secure logouts.
- **Visual Design**: Vanilla CSS utilizing CSS Custom Variables for a maintainable design system. Extensively uses pseudo-elements (`::before/after`) to implement performant "glassmorphism" blur effects without external heavy UI libraries.
- **Data Visualization**: Recharts library utilized directly reading complex aggregated analytics payloads from Node. 

---

## 5. Database Schema Design (MongoDB)
### Path: `backend/models/`

| Collection | Role | Key Indexed Fields |
|------------|------|--------------------|
| **Users** | Auth and identities | `email (Unique, Index)` |
| **Students** | Academic profile data | `studentId (Unique)`, `text index(name, email, studentId)` |
| **Predictions** | Historical ML results | `studentId + createdAt (Compound Index)` |

*Note: `Predictions` are bound via Mongoose `ObjectId` refs to `Students`, creating a one-to-many relationship enabling time-series tracking of student performance trends over multiple semesters.*

---

## 6. Scalability & Future Extensibility

- **Decoupled Deployment**: The ML service and Node server specify separate ports explicitly so they can be containerized using distinct Docker instances.
- **Handling ML Compute Load**: If CSV files grow to gigabytes, the `train_model.py` can be easily migrated to Celery/Redis background workers, while the FastAPI endpoints transition to asynchronous polling status checks.
