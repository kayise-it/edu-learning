const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  pin: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    default: ''
  },
  grade: {
    type: Number,
    enum: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    default: 4
  },
  securityQuestions: {
    motherName: {
      type: String,
      required: true
    },
    childhoodName: {
      type: String,
      required: true
    },
    cousinName: {
      type: String,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  totalQuizzesTaken: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Student', StudentSchema);