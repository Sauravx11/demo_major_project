/**
 * Student Management Routes
 * CRUD operations, search, filter, pagination, CSV upload,
 * student self-submission with history logging, teacher submission view.
 */
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const Student = require('../models/Student');
const StudentSubmission = require('../models/StudentSubmission');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Multer config for CSV upload
const upload = multer({ dest: 'uploads/' });

/* ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT: specific paths (my-data, my-submissions, upload-csv, submit-data,
 * all-submissions) must be declared BEFORE the generic /:id routes to avoid
 * Express matching them as IDs.
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * GET /api/students/my-data
 * Student retrieves their own profile and latest prediction
 */
router.get('/my-data', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.json({ success: true, data: null, predictions: [] });
    }
    const Prediction = require('../models/Prediction');
    const predictions = await Prediction.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: student, predictions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/students/my-submissions
 * Student retrieves their full submission history (each form they submitted)
 */
router.get('/my-submissions', protect, authorize('student'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await StudentSubmission.countDocuments({ userId: req.user._id });
    const submissions = await StudentSubmission.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: submissions,
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
 * GET /api/students/all-submissions
 * Teacher sees ALL student-submitted records (most recent first)
 */
router.get('/all-submissions', protect, authorize('teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await StudentSubmission.countDocuments(query);
    const submissions = await StudentSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json({
      success: true,
      data: submissions,
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
 * POST /api/students/submit-data
 * Student submits their own academic data — auto-links to their user account.
 * Creates/updates their Student document, generates ML prediction,
 * and logs a new StudentSubmission history entry.
 */
router.post('/submit-data', protect, authorize('student'), async (req, res) => {
  try {
    const {
      attendance, studyHours, internalMarks, prevMarks,
      assignmentScore, sleepHours, participation, testAvg, backlogs
    } = req.body;

    const studentId = `STU-${req.user._id.toString().slice(-6).toUpperCase()}`;

    // Upsert student document
    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          studentId,
          name: req.user.name,
          email: req.user.email,
          userId: req.user._id,
          attendance:      parseFloat(attendance)      || 0,
          studyHours:      parseFloat(studyHours)      || 0,
          internalMarks:   parseFloat(internalMarks)   || 0,
          prevMarks:       parseFloat(prevMarks)        || 0,
          assignmentScore: parseFloat(assignmentScore) || 0,
          sleepHours:      parseFloat(sleepHours)      || 0,
          participation:   parseInt(participation)     || 0,
          testAvg:         parseFloat(testAvg)         || 0,
          backlogs:        parseInt(backlogs)           || 0,
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Auto-trigger ML prediction
    let prediction = null;
    let predictedMarks = null;
    let grade = 'N/A';
    let modelUsed = 'Random Forest';
    let recommendations = [];

    try {
      const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
        attendance:       student.attendance,
        study_hours:      student.studyHours,
        internal_marks:   student.internalMarks,
        prev_marks:       student.prevMarks,
        assignment_score: student.assignmentScore,
        sleep_hours:      student.sleepHours,
        participation:    student.participation,
        test_avg:         student.testAvg,
        backlogs:         student.backlogs
      });

      predictedMarks = mlRes.data.predicted_marks;
      grade          = mlRes.data.grade;
      modelUsed      = mlRes.data.model_used;
      recommendations = buildRecommendations(student, predictedMarks, grade);

      const Prediction = require('../models/Prediction');
      prediction = await Prediction.create({
        studentId:      student._id,
        predictedMarks,
        grade,
        modelUsed,
        features: {
          attendance:      student.attendance,
          studyHours:      student.studyHours,
          internalMarks:   student.internalMarks,
          prevMarks:       student.prevMarks,
          assignmentScore: student.assignmentScore,
          sleepHours:      student.sleepHours,
          participation:   student.participation,
          testAvg:         student.testAvg,
          backlogs:        student.backlogs
        },
        recommendations
      });
    } catch (mlErr) {
      console.log('ML prediction skipped:', mlErr.message);
    }

    // Always log a StudentSubmission history entry
    const submissionRecord = await StudentSubmission.create({
      userId:        req.user._id,
      studentName:   req.user.name,
      studentEmail:  req.user.email,
      studentDocId:  student._id,
      features: {
        attendance:      student.attendance,
        studyHours:      student.studyHours,
        internalMarks:   student.internalMarks,
        prevMarks:       student.prevMarks,
        assignmentScore: student.assignmentScore,
        sleepHours:      student.sleepHours,
        participation:   student.participation,
        testAvg:         student.testAvg,
        backlogs:        student.backlogs
      },
      predictedMarks,
      grade,
      modelUsed,
      recommendations,
      predictionId: prediction?._id || null
    });

    res.json({ success: true, data: student, prediction, submission: submissionRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/students/upload-csv
 * Upload CSV dataset – bulk create/update students (teacher only)
 */
router.post('/upload-csv', protect, authorize('teacher'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const results = [];
  let rowCount = 0;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => { results.push(row); rowCount++; })
        .on('end', resolve)
        .on('error', reject);
    });

    const operations = results.map((row, index) => {
      const sid = row.student_id || `STU${String(index + 1).padStart(4, '0')}`;
      return {
        updateOne: {
          filter: { studentId: sid },
          update: {
            $set: {
              studentId:       sid,
              name:            row.name || `Student ${sid}`,
              email:           row.email || '',
              attendance:      parseFloat(row.attendance)       || 0,
              studyHours:      parseFloat(row.study_hours)      || 0,
              internalMarks:   parseFloat(row.internal_marks)   || 0,
              prevMarks:       parseFloat(row.prev_marks)       || 0,
              assignmentScore: parseFloat(row.assignment_score) || 0,
              sleepHours:      parseFloat(row.sleep_hours)      || 0,
              participation:   parseFloat(row.participation)    || 0,
              testAvg:         parseFloat(row.test_avg)         || 0,
              backlogs:        parseInt(row.backlogs)           || 0,
              finalMarks:      parseFloat(row.final_marks)      || null,
              createdBy:       req.user._id
            }
          },
          upsert: true
        }
      };
    });

    await Student.bulkWrite(operations);

    // Forward CSV to ML service for retraining
    try {
      const formData = new (require('form-data'))();
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: 'text/csv'
      });
      await axios.post(`${process.env.ML_SERVICE_URL}/upload-csv`, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
      });
    } catch (mlErr) {
      console.log('ML service not available for auto-training:', mlErr.message);
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Successfully imported ${rowCount} students`,
      count: rowCount
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/students
 * Get all students with search, filter, and pagination
 */
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search = '',
      sortBy = 'createdAt', order = 'desc',
      minAttendance, maxAttendance
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name:      { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    if (minAttendance || maxAttendance) {
      query.attendance = {};
      if (minAttendance) query.attendance.$gte = parseFloat(minAttendance);
      if (maxAttendance) query.attendance.$lte = parseFloat(maxAttendance);
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: students,
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
 * GET /api/students/:id
 * Get a single student by ID
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/students
 * Create a new student (teacher only)
 */
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/students/:id
 * Update a student (teacher only)
 */
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/students/:id
 * Delete a student (teacher only)
 */
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** Helper: generate personalised recommendations */
function buildRecommendations(student, predictedMarks, grade) {
  const recs = [];
  if (student.attendance < 60)
    recs.push('⚠️ Critical: Attendance is very low (< 60%). Aim for at least 75% to qualify for exams.');
  else if (student.attendance < 75)
    recs.push('📋 Attendance is below 75%. Regular attendance strongly correlates with better scores.');
  if (student.studyHours < 2)
    recs.push('📚 You are studying less than 2 hours per day. Try for at least 3–4 focused hours daily.');
  if (student.backlogs > 0)
    recs.push(`🔄 You have ${student.backlogs} backlog(s). Clearing them should be your top priority.`);
  if (student.sleepHours < 6)
    recs.push('😴 Less than 6 hours of sleep detected. Adequate rest (7–8 h) significantly improves memory.');
  if (student.internalMarks < 50)
    recs.push('📝 Internal marks are below 50. Participate more in class tests and internal assessments.');
  if (student.assignmentScore < 50)
    recs.push('📄 Assignment scores need improvement. Submit on time and invest more effort in each assignment.');
  if (student.participation === 0)
    recs.push('🙋 No class participation recorded. Actively engaging in class boosts understanding and marks.');
  if (grade === 'Fail')
    recs.push('🚨 You are at serious risk of failing. Seek help from your teacher or a tutor immediately.');
  else if (grade === 'C')
    recs.push('📈 You are passing but there is significant room for improvement. Focus on weak areas.');
  else if (grade === 'B')
    recs.push('👍 Good performance! A little more effort in your weak subjects can push you to an A.');
  else if (grade === 'A')
    recs.push('🌟 Excellent! Keep up the great work and help your peers where you can.');
  return recs;
}

module.exports = router;
