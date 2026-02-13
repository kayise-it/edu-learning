const Student = require('../models/Student');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Student login
// @route   POST /api/student/login
exports.login = async (req, res) => {
  try {
    const { username, pin } = req.body;
    
    const student = await Student.findOne({ username, pin });
    
    if (student) {
      student.lastLogin = new Date();
      await student.save();
      
      res.json({
        success: true,
        message: 'Login successful',
        student: {
          id: student._id,
          username: student.username,
          grade: student.grade,
          fullName: student.fullName
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or PIN'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student registration
// @route   POST /api/student/register
exports.register = async (req, res) => {
  try {
    const { username, pin, securityQuestions, fullName, grade } = req.body;
    
    // Check if user exists
    const existingUser = await Student.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Normalize security questions
    const normalizedQuestions = {
      motherName: (securityQuestions.motherName || '').trim().toLowerCase(),
      childhoodName: (securityQuestions.childhoodName || '').trim().toLowerCase(),
      cousinName: (securityQuestions.cousinName || '').trim().toLowerCase()
    };
    
    // Create new student
    const student = new Student({
      username,
      pin,
      securityQuestions: normalizedQuestions,
      fullName: fullName || '',
      grade: grade || 9
    });
    
    await student.save();
    
    res.status(201).json({
      message: 'Registration successful!',
      student: {
        id: student._id,
        username: student.username,
        grade: student.grade
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available quizzes for student
// @route   GET /api/student/quizzes
exports.getAvailableQuizzes = async (req, res) => {
  try {
    const { grade, subject, studentId } = req.query;
    let query = { 
      grade: parseInt(grade),
      isActive: true,
      dueDate: { $gte: new Date() }
    };
    
    if (subject) query.subject = subject;
    
    const quizzes = await Quiz.find(query)
      .select('-questions.correctAnswer')
      .sort({ createdAt: -1 });
    
    // Check how many attempts each student has used
    if (studentId) {
      const quizzesWithAttempts = await Promise.all(quizzes.map(async (quiz) => {
        const attemptCount = await QuizAttempt.countDocuments({
          studentId,
          quizId: quiz._id
        });
        
        return {
          ...quiz.toObject(),
          attemptsUsed: attemptCount,
          attemptsRemaining: Math.max(0, quiz.attemptsAllowed - attemptCount),
          canTake: attemptCount < quiz.attemptsAllowed
        };
      }));
      
      return res.json(quizzesWithAttempts);
    }
    
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get quiz for taking (with timer)
// @route   GET /api/student/quizzes/:id/take
exports.getQuizForTake = async (req, res) => {
  try {
    const { studentId } = req.query;
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if student has attempts remaining
    if (studentId) {
      const attemptCount = await QuizAttempt.countDocuments({
        studentId,
        quizId: quiz._id
      });
      
      if (attemptCount >= quiz.attemptsAllowed) {
        return res.status(403).json({ 
          message: `You have used all ${quiz.attemptsAllowed} attempts for this quiz`,
          attemptsUsed: attemptCount,
          attemptsAllowed: quiz.attemptsAllowed
        });
      }
    }
    
    // Check if quiz is still active
    if (!quiz.isActive) {
      return res.status(403).json({ message: 'This quiz is no longer active' });
    }
    
    // Check if quiz is past due date
    if (quiz.dueDate < new Date()) {
      return res.status(403).json({ message: 'This quiz has expired' });
    }
    
    // Remove correct answers for student
    const quizForStudent = quiz.toObject();
    quizForStudent.questions = quizForStudent.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      points: q.points
    }));
    
    res.json({
      ...quizForStudent,
      serverTime: new Date().toISOString(),
      timeLimit: quiz.timeLimit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/student/quizzes/:id/submit
exports.submitQuiz = async (req, res) => {
  try {
    const { studentId, studentName, answers, timeSpent, autoSubmitted } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check attempts remaining
    const attemptCount = await QuizAttempt.countDocuments({
      studentId,
      quizId: quiz._id
    });
    
    if (attemptCount >= quiz.attemptsAllowed) {
      return res.status(403).json({ 
        message: `You have used all ${quiz.attemptsAllowed} attempts`,
        attemptsUsed: attemptCount,
        attemptsAllowed: quiz.attemptsAllowed
      });
    }
    
    // Grade the quiz
    let score = 0;
    const gradedAnswers = quiz.questions.map((question, index) => {
      const studentAnswer = answers ? answers.find(a => a.questionId === index) : null;
      const selectedAnswer = studentAnswer ? studentAnswer.selectedAnswer : -1;
      const isCorrect = selectedAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;
      score += points;
      
      return {
        questionId: index,
        selectedAnswer,
        isCorrect,
        points
      };
    });
    
    const percentage = quiz.totalPoints > 0 ? (score / quiz.totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;
    
    const attempt = new QuizAttempt({
      studentId,
      studentName,
      quizId: quiz._id,
      quizTitle: quiz.title,
      answers: gradedAnswers,
      score,
      totalPoints: quiz.totalPoints,
      percentage,
      submittedAt: new Date(),
      timeSpent: timeSpent || quiz.timeLimit * 60,
      passed,
      autoSubmitted: autoSubmitted || false
    });
    
    await attempt.save();
    
    // Update student stats
    const student = await Student.findById(studentId);
    if (student) {
      const attempts = await QuizAttempt.find({ studentId });
      const avgScore = attempts.length > 0 
        ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length 
        : 0;
      
      student.totalQuizzesTaken = attempts.length;
      student.averageScore = avgScore;
      await student.save();
    }
    
    // Update quiz attempts count
    quiz.attempts += 1;
    await quiz.save();
    
    res.json({
      message: autoSubmitted ? 'Time expired! Quiz submitted automatically.' : 'Quiz submitted successfully',
      score,
      totalPoints: quiz.totalPoints,
      percentage: percentage.toFixed(1),
      passed,
      attemptsRemaining: quiz.attemptsAllowed - (attemptCount + 1),
      autoSubmitted: autoSubmitted || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auto-submit quiz when time expires
// @route   POST /api/student/quizzes/:id/auto-submit
exports.autoSubmitQuiz = async (req, res) => {
  try {
    req.body.autoSubmitted = true;
    return exports.submitQuiz(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's quiz history
// @route   GET /api/student/:studentId/history
exports.getQuizHistory = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ 
      studentId: req.params.studentId 
    })
    .sort({ submittedAt: -1 })
    .select('quizTitle score totalPoints percentage passed submittedAt timeSpent autoSubmitted');
    
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student dashboard data
// @route   GET /api/student/:studentId/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .select('-pin -securityQuestions');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const recentQuizzes = await QuizAttempt.find({ 
      studentId: req.params.studentId 
    })
    .sort({ submittedAt: -1 })
    .limit(5);
    
    const availableQuizzes = await Quiz.find({ 
      grade: student.grade,
      isActive: true,
      dueDate: { $gte: new Date() }
    })
    .select('-questions.correctAnswer')
    .limit(6);
    
    // Add attempt counts to available quizzes
    const quizzesWithAttempts = await Promise.all(availableQuizzes.map(async (quiz) => {
      const attemptCount = await QuizAttempt.countDocuments({
        studentId: req.params.studentId,
        quizId: quiz._id
      });
      
      return {
        ...quiz.toObject(),
        attemptsUsed: attemptCount,
        attemptsRemaining: Math.max(0, quiz.attemptsAllowed - attemptCount),
        canTake: attemptCount < quiz.attemptsAllowed
      };
    }));
    
    const avgScore = recentQuizzes.length > 0
      ? recentQuizzes.reduce((sum, q) => sum + q.percentage, 0) / recentQuizzes.length
      : 0;
    
    res.json({
      student,
      stats: {
        totalQuizzesTaken: student.totalQuizzesTaken || 0,
        averageScore: (student.averageScore || 0).toFixed(1),
        passRate: recentQuizzes.length > 0
          ? ((recentQuizzes.filter(q => q.passed).length / recentQuizzes.length) * 100).toFixed(1)
          : 0
      },
      recentQuizzes,
      availableQuizzes: quizzesWithAttempts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};