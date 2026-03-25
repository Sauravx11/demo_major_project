/**
 * Prediction Routes
 * Trigger ML predictions and retrieve stored results
 */
const express = require('express');
const axios = require('axios');
const Student = require('../models/Student');
const Prediction = require('../models/Prediction');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Generate smart recommendations based on student data
 */
function generateRecommendations(features, predictedMarks, grade) {
  const recs = [];

  if (features.attendance < 60) {
    recs.push('⚠️ Critical: Attendance is very low. Aim for at least 75% to see improvement.');
  } else if (features.attendance < 75) {
    recs.push('📋 Attendance below 75%. Regular attendance strongly correlates with better marks.');
  }

  if (features.studyHours < 2) {
    recs.push('📚 Study hours are low. Try to study at least 3-4 hours daily for better results.');
  }

  if (features.backlogs > 0) {
    recs.push(`🔄 ${features.backlogs} backlog(s) detected. Clear backlogs to improve overall performance.`);
  }

  if (features.sleepHours < 5) {
    recs.push('😴 Getting less than 5 hours of sleep. Adequate sleep (7-8 hrs) improves cognition.');
  }

  if (features.internalMarks < 50) {
    recs.push('📝 Internal marks are below average. Focus on internal assessments and class tests.');
  }

  if (features.assignmentScore < 50) {
    recs.push('📄 Assignment scores need improvement. Submit assignments on time and with quality.');
  }

  if (features.participation === 0) {
    recs.push('🙋 No class participation recorded. Active participation boosts understanding.');
  }

  if (grade === 'Fail') {
    recs.push('🚨 Performance is at risk. Consider tutoring or extra study sessions immediately.');
  } else if (grade === 'C') {
    recs.push('📈 Room for improvement. Focus on weak areas identified in feature importance.');
  } else if (grade === 'A') {
    recs.push('🌟 Excellent performance! Maintain current study habits and help peers.');
  }

  return recs;
}

/**
 * POST /api/predictions/predict/:studentId
 * Trigger prediction for a single student via ML service
 */
router.post('/predict/:studentId', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const features = {
      attendance: student.attendance,
      study_hours: student.studyHours,
      internal_marks: student.internalMarks,
      prev_marks: student.prevMarks,
      assignment_score: student.assignmentScore,
      sleep_hours: student.sleepHours,
      participation: student.participation,
      test_avg: student.testAvg,
      backlogs: student.backlogs
    };

    // Call ML service
    const mlResponse = await axios.post(`${ML_URL}/predict`, features);
    const { predicted_marks, grade, model_used } = mlResponse.data;

    // Generate recommendations
    const recFeatures = {
      attendance: student.attendance,
      studyHours: student.studyHours,
      internalMarks: student.internalMarks,
      prevMarks: student.prevMarks,
      assignmentScore: student.assignmentScore,
      sleepHours: student.sleepHours,
      participation: student.participation,
      testAvg: student.testAvg,
      backlogs: student.backlogs
    };
    const recommendations = generateRecommendations(recFeatures, predicted_marks, grade);

    // Store prediction in DB
    const prediction = await Prediction.create({
      studentId: student._id,
      predictedMarks: predicted_marks,
      grade,
      modelUsed: model_used,
      features: recFeatures,
      recommendations
    });

    res.json({
      success: true,
      data: {
        prediction,
        student: { name: student.name, studentId: student.studentId }
      }
    });
  } catch (err) {
    if (err.response && err.response.status === 503) {
      return res.status(503).json({ success: false, message: 'ML models not trained yet. Please train first.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/predictions/predict-all
 * Trigger predictions for all students (teacher only)
 */
router.post('/predict-all', protect, authorize('teacher'), async (req, res) => {
  try {
    const students = await Student.find();
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found' });
    }

    const batchPayload = {
      students: students.map(s => ({
        student_id: s._id.toString(),
        features: {
          attendance: s.attendance,
          study_hours: s.studyHours,
          internal_marks: s.internalMarks,
          prev_marks: s.prevMarks,
          assignment_score: s.assignmentScore,
          sleep_hours: s.sleepHours,
          participation: s.participation,
          test_avg: s.testAvg,
          backlogs: s.backlogs
        }
      }))
    };

    const mlResponse = await axios.post(`${ML_URL}/predict-batch`, batchPayload);
    const { predictions } = mlResponse.data;

    // Store all predictions
    const predOps = predictions.map((p, idx) => {
      const student = students.find(s => s._id.toString() === p.student_id);
      const recFeatures = student ? {
        attendance: student.attendance,
        studyHours: student.studyHours,
        internalMarks: student.internalMarks,
        prevMarks: student.prevMarks,
        assignmentScore: student.assignmentScore,
        sleepHours: student.sleepHours,
        participation: student.participation,
        testAvg: student.testAvg,
        backlogs: student.backlogs
      } : {};

      return {
        studentId: p.student_id,
        predictedMarks: p.predicted_marks,
        grade: p.grade,
        modelUsed: mlResponse.data.model_used,
        features: recFeatures,
        recommendations: student ? generateRecommendations(recFeatures, p.predicted_marks, p.grade) : []
      };
    });

    await Prediction.insertMany(predOps);

    res.json({
      success: true,
      message: `Predictions generated for ${predictions.length} students`,
      count: predictions.length
    });
  } catch (err) {
    if (err.response && err.response.status === 503) {
      return res.status(503).json({ success: false, message: 'ML models not trained yet.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/predictions
 * Get all latest predictions (teacher) or personal predictions (student)
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    let query = {};

    // If student role, only show own predictions
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
      }
      query.studentId = student._id;
    }

    const total = await Prediction.countDocuments(query);
    const predictions = await Prediction.find(query)
      .populate('studentId', 'name studentId email attendance')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: predictions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/predictions/student/:studentId
 * Get predictions for a specific student
 */
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const predictions = await Prediction.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: predictions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/predictions/metrics
 * Get ML model metrics from ML service
 */
router.get('/metrics', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_URL}/metrics`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch metrics from ML service' });
  }
});

/**
 * GET /api/predictions/feature-importance
 * Get feature importance from ML service
 */
router.get('/feature-importance', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_URL}/feature-importance`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch feature importance' });
  }
});

/**
 * POST /api/predictions/train
 * Trigger model training (teacher only)
 */
router.post('/train', protect, authorize('teacher'), async (req, res) => {
  try {
    const response = await axios.post(`${ML_URL}/train`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not trigger ML training' });
  }
});

module.exports = router;
