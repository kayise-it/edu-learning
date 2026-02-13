const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');

// Admin auth
router.post('/login', adminController.login);
router.get('/stats', adminController.getStats);

// Student management
router.get('/students', adminController.getAllStudents);
router.delete('/students/:id', adminController.deleteStudent);
router.get('/students/:id/performance', adminController.getStudentPerformance);

// Content management with file upload
router.post('/content', upload.single('file'), adminController.uploadContent);
router.get('/content', adminController.getAllContent);
router.delete('/content/:id', adminController.deleteContent);

// Quiz management
router.post('/quizzes', adminController.createQuiz);
router.get('/quizzes', adminController.getAllQuizzes);
router.get('/quizzes/:id', adminController.getQuiz);
router.put('/quizzes/:id', adminController.updateQuiz);
router.delete('/quizzes/:id', adminController.deleteQuiz);
router.get('/quizzes/:id/results', adminController.getQuizResults);

module.exports = router;