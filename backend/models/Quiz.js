const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required: true,
    min: 4,
    max: 12
  },
  description: {
    type: String,
    default: ''
  },
  questions: [QuestionSchema],
  timeLimit: {
    type: Number,
    default: 30,
    min: 5,
    max: 120
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attemptsAllowed: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  passingScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 0
  }
});

// Calculate total points before saving
QuizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema);