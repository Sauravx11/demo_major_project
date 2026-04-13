/**
 * Analytics Routes
 * Dashboard analytics data for charts, visualizations, top/weak students.
 */
const express = require('express');
const Student = require('../models/Student');
const Prediction = require('../models/Prediction');
const StudentSubmission = require('../models/StudentSubmission');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Class overview statistics
 */
router.get('/overview', protect, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalPredictions = await Prediction.countDocuments();
    const totalSubmissions = await StudentSubmission.countDocuments();

    const avgStats = await Student.aggregate([{
      $group: {
        _id: null,
        avgAttendance: { $avg: '$attendance' },
        avgStudyHours: { $avg: '$studyHours' },
        avgInternalMarks: { $avg: '$internalMarks' },
        avgAssignmentScore: { $avg: '$assignmentScore' },
        avgFinalMarks: { $avg: '$finalMarks' },
        avgTestAvg: { $avg: '$testAvg' },
        avgBacklogs: { $avg: '$backlogs' },
      }
    }]);

    // Grade distribution from latest predictions
    const gradeDistribution = await Prediction.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$studentId', latestGrade: { $first: '$grade' } } },
      { $group: { _id: '$latestGrade', count: { $sum: 1 } } }
    ]);

    const atRiskCount = await Student.countDocuments({
      $or: [{ attendance: { $lt: 60 } }, { backlogs: { $gte: 3 } }]
    });

    // Recent student submissions (latest 5, for teacher dashboard)
    const recentSubmissions = await StudentSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('studentName studentEmail predictedMarks grade createdAt features');

    res.json({
      success: true,
      data: {
        totalStudents,
        totalPredictions,
        totalSubmissions,
        averages: avgStats[0] || {},
        gradeDistribution: gradeDistribution.reduce((acc, g) => {
          acc[g._id] = g.count;
          return acc;
        }, {}),
        atRiskCount,
        recentSubmissions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/top-weak-students
 * Returns top 5 and bottom 5 students by latest predicted marks.
 * Uses simple find+populate instead of multi-stage aggregation for reliability.
 */
router.get('/top-weak-students', protect, async (req, res) => {
  try {
    // Fetch all predictions (latest first) and populate student name/id/attendance
    const allPredictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .populate('studentId', 'name studentId email attendance');

    // Keep only the LATEST prediction per student
    const seen = new Set();
    const latest = [];
    for (const p of allPredictions) {
      if (!p.studentId) continue;                        // skip orphaned predictions
      const key = p.studentId._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        latest.push({
          name:           p.studentId.name,
          studentId:      p.studentId.studentId,
          email:          p.studentId.email,
          attendance:     p.studentId.attendance,
          predictedMarks: p.predictedMarks,
          grade:          p.grade
        });
      }
    }

    // Sort descending by predictedMarks
    latest.sort((a, b) => b.predictedMarks - a.predictedMarks);

    const topStudents  = latest.slice(0, 5);
    const weakStudents = latest.slice(-5).reverse();

    res.json({ success: true, data: { topStudents, weakStudents } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/at-risk-students
 * Returns detailed list of at-risk students (attendance < 60 OR backlogs >= 3)
 * along with their latest prediction data (if available).
 */
router.get('/at-risk-students', protect, authorize('teacher'), async (req, res) => {
  try {
    // Same criteria used in /overview for atRiskCount
    const atRiskStudents = await Student.find({
      $or: [{ attendance: { $lt: 60 } }, { backlogs: { $gte: 3 } }]
    }).select('name studentId email attendance backlogs studyHours').lean();

    // Fetch latest prediction for each at-risk student
    const studentIds = atRiskStudents.map(s => s._id);
    const latestPredictions = await Prediction.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$studentId',
          predictedMarks: { $first: '$predictedMarks' },
          grade: { $first: '$grade' }
        }
      }
    ]);

    // Build a map for quick lookup
    const predMap = {};
    for (const p of latestPredictions) {
      predMap[p._id.toString()] = { predictedMarks: p.predictedMarks, grade: p.grade };
    }

    const result = atRiskStudents.map(s => ({
      name: s.name,
      studentId: s.studentId,
      email: s.email,
      attendance: s.attendance,
      backlogs: s.backlogs,
      studyHours: s.studyHours,
      predictedMarks: predMap[s._id.toString()]?.predictedMarks || null,
      grade: predMap[s._id.toString()]?.grade || null
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/student-overview
 * Personal stats for the logged-in student
 */
router.get('/student-overview', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.json({ success: true, data: null });
    }

    // Prediction history
    const predictions = await Prediction.find({ studentId: student._id })
      .sort({ createdAt: 1 })
      .limit(15);

    // Submission count
    const submissionCount = await StudentSubmission.countDocuments({ userId: req.user._id });

    // Latest prediction
    const latestPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;

    // Radar chart data
    const radarData = [
      { subject: 'Attendance', value: student.attendance, fullMark: 100 },
      { subject: 'Study Hours', value: Math.min((student.studyHours / 10) * 100, 100), fullMark: 100 },
      { subject: 'Internal', value: student.internalMarks, fullMark: 100 },
      { subject: 'Assignments', value: student.assignmentScore, fullMark: 100 },
      { subject: 'Test Avg', value: student.testAvg, fullMark: 100 },
      { subject: 'Prev Marks', value: student.prevMarks, fullMark: 100 },
    ];

    // Trend data for line chart
    const trendData = predictions.map(p => ({
      date: new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      predictedMarks: p.predictedMarks,
      grade: p.grade
    }));

    res.json({
      success: true,
      data: {
        student,
        latestPrediction,
        submissionCount,
        radarData,
        trendData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/attendance-vs-marks
 */
router.get('/attendance-vs-marks', protect, async (req, res) => {
  try {
    const data = await Student.find({}, 'name studentId attendance finalMarks').lean();
    res.json({
      success: true,
      data: data.map(s => ({
        name: s.name,
        studentId: s.studentId,
        attendance: Math.round((s.attendance || 0) * 100) / 100,
        finalMarks: Math.round((s.finalMarks || 0) * 100) / 100
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/study-hours-vs-performance
 */
router.get('/study-hours-vs-performance', protect, async (req, res) => {
  try {
    const data = await Student.find({}, 'name studentId studyHours finalMarks').lean();
    res.json({
      success: true,
      data: data.map(s => ({
        name: s.name,
        studentId: s.studentId,
        studyHours: Math.round((s.studyHours || 0) * 100) / 100,
        finalMarks: Math.round((s.finalMarks || 0) * 100) / 100
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/performance-distribution
 */
router.get('/performance-distribution', protect, async (req, res) => {
  try {
    const distribution = await Student.aggregate([{
      $bucket: {
        groupBy: '$finalMarks',
        boundaries: [0, 40, 50, 60, 70, 80, 90, 101],
        default: 'Other',
        output: { count: { $sum: 1 }, students: { $push: '$name' } }
      }
    }]);

    const labels = ['0-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100'];
    const boundaries = [0, 40, 50, 60, 70, 80, 90];
    const formatted = labels.map((label, idx) => {
      const bucket = distribution.find(d => d._id === boundaries[idx]);
      return { range: label, count: bucket ? bucket.count : 0 };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/student-performance/:studentId
 * Individual student performance data (teacher view)
 */
router.get('/student-performance/:studentId', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const predictions = await Prediction.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const radarData = [
      { subject: 'Attendance', value: student.attendance, fullMark: 100 },
      { subject: 'Study Hours', value: (student.studyHours / 10) * 100, fullMark: 100 },
      { subject: 'Internal', value: student.internalMarks, fullMark: 100 },
      { subject: 'Assignments', value: student.assignmentScore, fullMark: 100 },
      { subject: 'Test Avg', value: student.testAvg, fullMark: 100 },
      { subject: 'Participation', value: student.participation * 100, fullMark: 100 }
    ];

    res.json({ success: true, data: { student, predictions, radarData } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
