# 🎓 EduPredict AI — Student Performance Analytics & Management System

An end-to-end **AI-powered SaaS platform** for student performance prediction and academic management.

Built with **MERN stack** (MongoDB + Express + React + Node.js) and a **Python ML microservice** (FastAPI + scikit-learn).

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.9
- MongoDB (local on port 27017 **or** MongoDB Atlas URI)

---

### 1️⃣ Clone & install

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# ML Service
cd ml-service && pip install -r requirements.txt
```

---

### 2️⃣ Configure environment

`backend/.env` is already configured for local development:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/student_performance
JWT_SECRET=student_perf_jwt_secret_key_2024
ML_SERVICE_URL=http://localhost:5001
```

---

### 3️⃣ Start services (3 terminals)

```bash
# Terminal 1 – MongoDB (if running locally)
mongod

# Terminal 2 – ML Service
cd ml-service
python app.py
# Starts on http://localhost:5001 and auto-trains if models exist

# Terminal 3 – Backend API
cd backend
npm start
# Starts on http://localhost:5000

# Terminal 4 – Frontend Dev Server
cd frontend
npm run dev
# Opens on http://localhost:5173
```

---

### 4️⃣ First-time setup

1. Open `http://localhost:5173`
2. **Register as Teacher** (role: teacher)
3. Go to **Upload CSV** → upload `student_performance_dataset_2000.csv`
4. Click **Train ML Models** to train all three models
5. Click **Predict All Students** on the Predictions page
6. **Register a second account as Student**, log in, go to **Submit Data**

---

## 👥 Role-Based Features

### 👨‍🏫 Teacher
| Feature | Route |
|---|---|
| Class analytics dashboard | `/dashboard` |
| Student CRUD + CSV upload | `/students` |
| Student submissions monitor | `/students` → Submissions tab |
| ML predictions (individual / all) | `/predictions` |
| Model metrics & feature importance | `/model-metrics` |
| Upload & retrain dataset | `/upload` |

### 👨‍🎓 Student
| Feature | Route |
|---|---|
| Personal dashboard (charts, history) | `/my-dashboard` |
| Submit academic data → instant prediction | `/submit` |
| View my prediction history | `/predictions` |

---

## 📁 Project Structure

```
student_performance_project/
├── backend/               # Node.js + Express API
│   ├── models/
│   │   ├── User.js             # Role-based auth (teacher/student)
│   │   ├── Student.js          # Academic data per student
│   │   ├── Prediction.js       # ML prediction results
│   │   └── StudentSubmission.js  # Per-submission history log
│   ├── routes/
│   │   ├── auth.js             # Register/login/me
│   │   ├── students.js         # CRUD + self-submit + submissions
│   │   ├── predictions.js      # ML trigger + history
│   │   └── analytics.js        # Dashboard analytics
│   ├── middleware/auth.js       # JWT + role authorization
│   └── server.js
│
├── frontend/              # React + Recharts
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── SignupPage.jsx
│       │   ├── DashboardPage.jsx        # Teacher analytics
│       │   ├── StudentsPage.jsx         # CRUD + Submissions tab
│       │   ├── PredictionsPage.jsx
│       │   ├── ModelMetricsPage.jsx
│       │   ├── UploadPage.jsx
│       │   ├── StudentInputPage.jsx     # 🆕 Student self-service form
│       │   └── StudentDashboardPage.jsx # 🆕 Student personal dashboard
│       ├── components/Sidebar.jsx       # Role-based navigation
│       ├── context/AuthContext.jsx      # JWT auth state
│       └── services/api.js             # Axios service layer
│
└── ml-service/            # Python FastAPI + scikit-learn
    ├── app.py              # FastAPI endpoints
    ├── train_model.py      # RF + LR + DT training
    └── requirements.txt
```

---

## 🤖 ML Models

| Model | Expected R² |
|---|---|
| **Random Forest** (primary) | ~0.92–0.96 |
| Linear Regression | ~0.80–0.88 |
| Decision Tree | ~0.85–0.92 |

Features: `attendance`, `study_hours`, `internal_marks`, `prev_marks`, `assignment_score`, `stream`, `science_type`, `physics`, `chemistry`, `maths`, `biology`, `accounts`, `business_studies`, `economics`, `history`, `political_science`, `geography`, `participation`, `test_avg`, `backlogs`

Target: `final_marks` (0–100) → Derived grade (A ≥ 85, B ≥ 70, C ≥ 50, Fail < 50)

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Required |

### Students
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/students` | Any |
| POST | `/api/students` | Teacher |
| PUT | `/api/students/:id` | Teacher |
| DELETE | `/api/students/:id` | Teacher |
| POST | `/api/students/upload-csv` | Teacher |
| GET | `/api/students/all-submissions` | Teacher |
| POST | `/api/students/submit-data` | Student |
| GET | `/api/students/my-data` | Student |
| GET | `/api/students/my-submissions` | Student |

### Predictions
| Method | Endpoint | Role |
|---|---|---|
| POST | `/api/predictions/predict/:studentId` | Any |
| POST | `/api/predictions/predict-all` | Teacher |
| POST | `/api/predictions/train` | Teacher |
| GET | `/api/predictions` | Any |
| GET | `/api/predictions/metrics` | Any |
| GET | `/api/predictions/feature-importance` | Any |

### Analytics
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/analytics/overview` | Any |
| GET | `/api/analytics/top-weak-students` | Any |
| GET | `/api/analytics/student-overview` | Student |
| GET | `/api/analytics/attendance-vs-marks` | Any |
| GET | `/api/analytics/study-hours-vs-performance` | Any |
| GET | `/api/analytics/performance-distribution` | Any |

### ML Service (Port 5001)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/train` | Train all models |
| POST | `/predict` | Single prediction |
| POST | `/predict-batch` | Batch predictions |
| GET | `/metrics` | R², MAE, RMSE, CV |
| GET | `/feature-importance` | RF feature importance |
| POST | `/upload-csv` | Upload + retrain |

---

## 📊 Sample Dataset

`student_performance_dataset_2000.csv` — 2000 realistic synthetic student records included in the project root. Upload via the **Upload CSV** page to populate the database and train models.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, React Router v6 |
| Backend | Node.js, Express, Mongoose, JWT, Multer |
| Database | MongoDB |
| ML Service | Python, FastAPI, scikit-learn, pandas, joblib |
| Auth | JWT (30-day tokens), bcrypt password hashing |
