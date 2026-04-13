/**
 * StudentSubmission Model
 * Records every individual data submission made by a student.
 * This gives teachers a full audit trail and students their history.
 */
const mongoose = require('mongoose');

const studentSubmissionSchema = new mongoose.Schema({
  // The User account that submitted this record
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of student profile at time of submission
  studentName: { type: String, required: true },
  studentEmail: { type: String, default: '' },
  // Linked student document (created/updated on submit)
  studentDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  // Academic feature snapshot
  features: {
    attendance:        { type: Number, required: true },
    studyHours:        { type: Number, required: true },
    internalMarks:     { type: Number, required: true },
    prevMarks:         { type: Number, required: true },
    assignmentScore:   { type: Number, required: true },
    stream:            { type: String, enum: ['Science', 'Commerce', 'Arts'], required: true },
    scienceType:       { type: String, default: '' },
    physics:           { type: Number, default: 0 },
    chemistry:         { type: Number, default: 0 },
    maths:             { type: Number, default: 0 },
    biology:           { type: Number, default: 0 },
    accounts:          { type: Number, default: 0 },
    businessStudies:   { type: Number, default: 0 },
    economics:         { type: Number, default: 0 },
    history:           { type: Number, default: 0 },
    politicalScience:  { type: Number, default: 0 },
    geography:         { type: Number, default: 0 },
    participation:     { type: Number, required: true },
    testAvg:           { type: Number, required: true },
    backlogs:          { type: Number, required: true }
  },
  // ML prediction result at time of submission
  predictedMarks:  { type: Number, default: null },
  grade:           { type: String, enum: ['A', 'B', 'C', 'Fail', 'N/A'], default: 'N/A' },
  modelUsed:       { type: String, default: 'Random Forest' },
  recommendations: [{ type: String }],
  careerSuggestion: { type: String, default: '' },
  // Linked prediction document
  predictionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction',
    default: null
  }
}, { timestamps: true });

// Indexes for efficient lookups
studentSubmissionSchema.index({ userId: 1, createdAt: -1 });
studentSubmissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StudentSubmission', studentSubmissionSchema);
