const Student = require('../models/Student');
const Content = require('../models/Content');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Admin login
// @route   POST /api/admin/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // For demo purposes - in production, use proper authentication
    if (username === 'admin' && password === 'admin123') {
      res.json({
        success: true,
        message: 'Login successful',
        admin: { username, role: 'admin' }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalContent = await Content.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalAttempts = await QuizAttempt.countDocuments();
    
    const contentByType = await Content.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const recentActivity = await QuizAttempt.find()
      .sort({ submittedAt: -1 })
      .limit(10)
      .select('studentName quizTitle score percentage submittedAt');
    
    res.json({
      totalStudents,
      totalContent,
      totalQuizzes,
      totalAttempts,
      contentByType,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ STUDENT MANAGEMENT ============

// @desc    Get all students
// @route   GET /api/admin/students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select('-pin -securityQuestions')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Also delete all quiz attempts by this student
    await QuizAttempt.deleteMany({ studentId: req.params.id });
    
    console.log(`✅ Student deleted: ${student.username} (${req.params.id})`);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student performance
// @route   GET /api/admin/students/:id/performance
exports.getStudentPerformance = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ 
      studentId: req.params.id 
    }).sort({ submittedAt: -1 });
    
    const stats = {
      totalQuizzes: attempts.length,
      averageScore: attempts.length > 0 
        ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length).toFixed(1)
        : 0,
      passedQuizzes: attempts.filter(a => a.passed).length,
      recentAttempts: attempts.slice(0, 5)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ QUIZ MANAGEMENT ============

// @desc    Create quiz
// @route   POST /api/admin/quizzes
exports.createQuiz = async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all quizzes
// @route   GET /api/admin/quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single quiz
// @route   GET /api/admin/quizzes/:id
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quiz
// @route   PUT /api/admin/quizzes/:id
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json({
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/admin/quizzes/:id
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Also delete all attempts for this quiz
    await QuizAttempt.deleteMany({ quizId: req.params.id });
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get quiz results
// @route   GET /api/admin/quizzes/:id/results
exports.getQuizResults = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ quizId: req.params.id })
      .sort({ percentage: -1 })
      .populate('studentId', 'username grade');
    
    const quiz = await Quiz.findById(req.params.id);
    
    const stats = {
      totalAttempts: attempts.length,
      averageScore: attempts.length > 0 
        ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length).toFixed(1)
        : 0,
      passRate: attempts.length > 0
        ? ((attempts.filter(a => a.passed).length / attempts.length) * 100).toFixed(1)
        : 0,
      highestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0,
      lowestScore: attempts.length > 0 ? Math.min(...attempts.map(a => a.percentage)) : 0,
      attempts: attempts.map(a => ({
        studentName: a.studentName,
        studentId: a.studentId,
        score: a.score,
        totalPoints: a.totalPoints,
        percentage: a.percentage,
        passed: a.passed,
        timeSpent: a.timeSpent,
        submittedAt: a.submittedAt
      }))
    };
    
    res.json({ quiz, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ CONTENT MANAGEMENT ============

// @desc    Upload content
// @route   POST /api/admin/content
exports.uploadContent = async (req, res) => {
  try {
    const contentData = { ...req.body };
    
    // Handle file upload
    if (req.file) {
      contentData.url = `/uploads/${req.file.filename}`;
      contentData.fileName = req.file.originalname;
      contentData.fileSize = req.file.size;
      contentData.fileType = req.file.mimetype;
    }
    
    // Parse grade to number
    if (contentData.grade) {
      contentData.grade = parseInt(contentData.grade);
    }
    
    // Parse subtopics if they're strings
    if (typeof contentData.subtopics === 'string') {
      try {
        contentData.subtopics = JSON.parse(contentData.subtopics);
      } catch (e) {
        console.error("Error parsing subtopics:", e);
      }
    }
    
    const content = new Content(contentData);
    await content.save();
    
    res.status(201).json({
      message: `${contentData.type || 'Content'} uploaded successfully`,
      content
    });
  } catch (error) {
    console.error("❌ Content upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all content
// @route   GET /api/admin/content
exports.getAllContent = async (req, res) => {
  try {
    const { type, grade, subject } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (grade) query.grade = parseInt(grade);
    if (subject) query.subject = { $regex: new RegExp(subject, "i") };
    
    const content = await Content.find(query).sort({ createdAt: -1 });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete content
// @route   DELETE /api/admin/content/:id
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (content && content.url && content.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', content.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};