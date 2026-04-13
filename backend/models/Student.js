/**
 * Student Model – stores academic/performance data
 */
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  attendance: { type: Number, default: 0, min: 0, max: 100 },
  studyHours: { type: Number, default: 0, min: 0 },
  internalMarks: { type: Number, default: 0, min: 0, max: 100 },
  prevMarks: { type: Number, default: 0, min: 0, max: 100 },
  assignmentScore: { type: Number, default: 0, min: 0, max: 100 },
  stream: { type: String, enum: ['Science', 'Commerce', 'Arts'], required: true },
  scienceType: { type: String, enum: ['Maths', 'Bio', ''], default: '' },
  // Subject marks – only relevant subjects will be non-zero
  physics: { type: Number, default: 0, min: 0, max: 100 },
  chemistry: { type: Number, default: 0, min: 0, max: 100 },
  maths: { type: Number, default: 0, min: 0, max: 100 },
  biology: { type: Number, default: 0, min: 0, max: 100 },
  accounts: { type: Number, default: 0, min: 0, max: 100 },
  businessStudies: { type: Number, default: 0, min: 0, max: 100 },
  economics: { type: Number, default: 0, min: 0, max: 100 },
  history: { type: Number, default: 0, min: 0, max: 100 },
  politicalScience: { type: Number, default: 0, min: 0, max: 100 },
  geography: { type: Number, default: 0, min: 0, max: 100 },
  participation: { type: Number, default: 0 },
  testAvg: { type: Number, default: 0, min: 0, max: 100 },
  backlogs: { type: Number, default: 0, min: 0 },
  finalMarks: { type: Number, default: null },
  // Linked user account (optional)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Teacher who manages this student
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Text index for searching
studentSchema.index({ name: 'text', email: 'text', studentId: 'text' });

module.exports = mongoose.model('Student', studentSchema);
