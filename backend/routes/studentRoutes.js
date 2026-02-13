const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const contentController = require('../controllers/contentController');

// Student auth
router.post('/login', studentController.login);
router.post('/register', studentController.register);

// Content access
router.get('/content', contentController.getStudentContent);
router.put('/content/:id/view', contentController.incrementView);
router.put('/content/:id/download', contentController.incrementDownload);
router.get('/content/:id/download-file', contentController.downloadFile);

// Quiz access
router.get('/quizzes', studentController.getAvailableQuizzes);
router.get('/quizzes/:id/take', studentController.getQuizForTake);
router.post('/quizzes/:id/submit', studentController.submitQuiz);
router.post('/quizzes/:id/auto-submit', studentController.autoSubmitQuiz);

// Student data
router.get('/:studentId/history', studentController.getQuizHistory);
router.get('/:studentId/dashboard', studentController.getDashboard);

module.exports = router;