# 🎓 EduPredict AI — Technical Documentation
**AI-Powered Student Performance Analytics & Management System**

This comprehensive technical document provides a detailed overview of the system architecture, features, machine learning pipeline, and APIs for EduPredict AI. This report serves as the complete technical blueprint for development and presentation.

---

## 1. Executive Summary

EduPredict AI is a fully functional, production-ready SaaS platform that allows for the management and intelligent prediction of student academic performances. By integrating modern web-development frameworks with powerful, state-of-the-art predictive machine learning models, the system empowers educators and institutions to forecast student final grades based on granular academic parameters. 

**Core Objectives:**
1. **Teacher Insights**: Enable teachers to track class progress, upload batch data, and uncover performance trends via dashboards.
2. **Student Self-Service**: Allow students to submit their own data and view personalized real-time prediction feedback.
3. **Data-Driven Intervention**: Provide automated, rule-based recommendations alongside ML predictions to identify at-risk students before final assessments.

---

## 2. High-Level Architecture

The system utilizes a decoupled, microservices-inspired architecture spanning three primary layers:
- **Frontend (Presentation Layer)**: React 18 SPA built with Vite.
- **Backend (API Gateway & Core Business Logic)**: Node.js + Express.js.
- **ML Service (Inference & Training Layer)**: Python + FastAPI providing native scikit-learn model interfaces.
- **Database (Data Persistence)**: MongoDB caching both relational entities (Users/Students) and time-series records (Predictions/Submissions).

### 2.1 Request Flow Diagram
1. **Client Action**: Teacher uploads a CSV of students or a Student self-submits their study habits.
2. **REST API Gateway**: The Node.js server authenticates the JWT, processes the payload, and saves the base record in MongoDB.
3. **Inference Proxy**: Node.js maps the input features to the expected schema and POSTs the payload to the internal Python ML Service on Port `5001`.
4. **Machine Learning Inference**: Python unpickles the robust Random Forest models and StandardScalers, generating grade predictions.
5. **Business Logic Layer**: The result is passed back to Node.js, where a Recommendations Engine applies thresholds (e.g., Attendance < 75%) to generate qualitative advice.
6. **Data Storage & Response**: The full prediction document is stored in MongoDB, bridging the student data over time, and a JSON payload updates the React dashboard natively.

---

## 3. Technology Stack

### 3.1 Frontend (Client)
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Core Framework** | React 18, Vite | High performance component-based UI rendering with ultra-fast HMR builds. |
| **Routing** | React Router v6 | Client-side routing for instantaneous page transitions. |
| **State Management**| Context API (`useAuth`, `useSidebar`, `useTheme`) | Native, lightweight state injection avoiding Redux boilerplate. |
| **Data Fetching** | Axios Interceptors | Centralized HTTP client managing auth tokens inherently. |
| **Data Viz** | Recharts | Reactive charting directly driven by backend aggregation results. |
| **Styling** | Vanilla CSS (Variables) | "Glassmorphism" UI achieved natively without bloated component libraries. |

### 3.2 Backend (API)
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Node.js (Express.js layer) | Asynchronous, unblocking I/O ideal for proxying heavy Python requests. |
| **Database ORM** | Mongoose + MongoDB | Versatile document storage adept at evolving ML metadata schemas. |
| **Authentication**| JWT & bcrypt | Stateless, scalable security (tokens) with highly salted password hashes. |
| **File Parsing** | Multer & csv-parser | Streaming capabilities bypassing Node memory limits mapping large CSV arrays. |

### 3.3 Machine Learning (Microservice)
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Web Server** | FastAPI (Python) | High-throughput, async-capable HTTP routing designed for APIs. |
| **Model Engine** | scikit-learn | Production-hardened conventional estimators (Random Forest/Linear/DecisionTree). |
| **Data Processing**| pandas, numpy | Memory-efficient tabular data transformations and aggregations. |
| **Serialization** | joblib | Faster and more efficient model state pickling compared to standard `pickle`. |

---

## 4. Machine Learning Pipeline Architecture

The intelligence layer of the system operates dynamically, learning and scaling securely over newly uploaded institutional CSV data.

### 4.1 Feature Engineering & Preprocessing
- **Features Analyzed**: `attendance`, `study_hours`, `internal_marks`, `prev_marks`, `assignment_score`, `sleep_hours`, `participation`, `test_avg`, `backlogs`.
- **Target Variable**: `final_marks` (0–100 mapped safely to A/B/C/Fail Grades).
- **Missing Data Handling**: Numeric fields are defensively imputed using median strategies via `SimpleImputer`.
- **Normalization**: `StandardScaler` standardizes features to a mean of 0 and variance of 1, preventing high-magnitude features (like marks) from skewing models.

### 4.2 Training System
A dedicated `/train` endpoint triggers unbiased model evaluations:
1. **Cross-Validation**: 5-Fold K-Fold splitting ensures R² metrics highlight generalized capabilities, not over-fitted biases.
2. **Model Ensemble Strategy**:
   - **RandomForestRegressor (Primary)**: Generates highly accurate non-linear predictions resilient to tabular outliers (Expected R²: ~0.94).
   - **DecisionTreeRegressor**: Generates highly interpretable heuristics.
   - **LinearRegression**: Provides baseline performance measurements.
3. **Artifact Generation**: The optimally scoring model exports `scaler.pkl` and `model.pkl` to the drive asynchronously via `joblib`.

### 4.3 Feature Importance (Interpretability)
Crucially, the ML service extracts the percentage weights of features (`feature_importances_` from the Random Forest model). These are served to the frontend UI to mathematically prove to teachers *which exact parameters* are driving success parameters in their specific cohort.

---

## 5. Role-Based Feature Matrices

The software enforces isolated experiences via explicit JWT claims.

### 5.1 Teacher Persona Dashboard
| Module | Location | Details |
|--------|----------|---------|
| **Cohort Analytics** | `/dashboard` | Advanced data visualization combining grade distribution, top feature impacts, and identification of at-risk failing students using MongoDB Aggregation pipelines. |
| **Batch Importer** | `/upload` | High-bandwidth CSV ingestion streaming records securely linked directly to the uploading instructor's ObjectId referencing. |
| **Predictive Roster** | `/predictions` | Triggers batch `.predict-all` algorithms processing the entire class array via Python bridging simultaneously. |
| **Model Forensics** | `/model-metrics`| Transparently reveals the statistical capability of the current algorithmic brain (R², MAE, RMSE). |

### 5.2 Student Persona Dashboard
| Module | Location | Details |
|--------|----------|---------|
| **Self-Submission** | `/submit` | Empowering students to self-diagnose current semester parameters explicitly linked to their user account. |
| **Timeline View** | `/predictions` | A history graph mapping their performance trajectory based on historical submissions vs outcomes leveraging compound indexing. |

---

## 6. Database Schema Integrity

Leveraging MongoDB documents allows mapping highly nested analytical arrays natively:

1. **User Schema (`Users`)**:
   - Stores `email`, `role` (enum: teacher/student), and hashed `password`. 
   - Uniquely indexed for rapid log-in authentication querying.
   
2. **Student Profile Schema (`Students`)**:
   - Links via `createdBy` refs to Teacher IDs and optional `userId` for self-service mapping.
   - Encompasses strict data validators (e.g. `attendance {min:0, max: 100}`) and text-indexing for global fuzzy-search bars (`studentId`, `email`, `name`).

3. **Inference Tracking (`Predictions`)**:
   - Bound explicitly via `ObjectId` references back to the target `Student`.
   - Records all underlying features *at the moment of inference*, enabling forensic rollbacks if metrics diverge, mapping input values alongside output outcomes and generated recommendation arrays.

---

## 7. Scalability & Extensibility Provisions

Given the platform's multi-layered construction, its enterprise viability holds high long-term scalability:
- **Service Isolation**: Node API (Port 5000) and ML Service (Port 5001) operate entirely decoupled. During peak seasons (like finalize exams), the python container can be replicated using NGINX load balancing independently of the Web dashboard process.
- **Asynchronous Architectures**: Future releases can migrate the `train_model.py` process to a Redis/Celery worker array to prevent blocking API paths while handling massive multi-gigabyte dataset parsing.
- **State Neutrality**: Relying on stateless JWT tokens intrinsically allows the Node instances to run horizontally via tools like PM2 or Docker Swarm without needing sticky sessions.
