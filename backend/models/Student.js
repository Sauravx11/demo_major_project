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
  sleepHours: { type: Number, default: 0, min: 0 },
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
