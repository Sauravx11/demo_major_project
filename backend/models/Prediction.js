/**
 * Prediction Model – stores ML prediction results
 */
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  predictedMarks: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'Fail'],
    required: true
  },
  modelUsed: {
    type: String,
    default: 'Random Forest'
  },
  features: {
    attendance: Number,
    studyHours: Number,
    internalMarks: Number,
    prevMarks: Number,
    assignmentScore: Number,
    stream: String,
    scienceType: String,
    physics: Number,
    chemistry: Number,
    maths: Number,
    biology: Number,
    accounts: Number,
    businessStudies: Number,
    economics: Number,
    history: Number,
    politicalScience: Number,
    geography: Number,
    participation: Number,
    testAvg: Number,
    backlogs: Number
  },
  recommendations: [{
    type: String
  }],
  careerSuggestion: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Index for efficient queries
predictionSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
