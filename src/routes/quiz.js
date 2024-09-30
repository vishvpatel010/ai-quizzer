import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  generateNewQuiz,
  submitQuiz,
  getQuizHistory,
  retryQuiz,
  getHint,
} from '../controllers/quizController.js';

const router = express.Router();

router.use(auth);

router.post('/generate', generateNewQuiz);  // Generate a new quiz
router.post('/submit', submitQuiz);         // Submit a quiz
router.post('/history', getQuizHistory);    // Get quiz history
router.post('/retry', retryQuiz);           // Retry a quiz
router.post('/hint', getHint);              // Get a hint

export default router;
