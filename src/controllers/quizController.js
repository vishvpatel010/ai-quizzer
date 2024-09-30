import Quiz from '../models/Quiz.model.js';
import { generateQuiz, evaluateQuiz, generateSuggestions } from '../services/aiService.js';
import User from '../models/User.model.js';
import { sendResultEmail } from '../services/emailService.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateNewQuiz = async (req, res) => {
  try {
    let { grade, subject, totalQuestions, maxScore, difficulty } = req.body;

    // Validate grade
    if (grade < 1 || grade > 12) {
      return res.status(400).json({ message: 'Invalid Grade' });
    }

    // Validate maxScore
    if (maxScore < 1 || maxScore > 100) {
      return res.status(400).json({ message: 'Max score should be between 1 and 100' });
    }

    // Ensure maxScore doesn't exceed 5 points per question
    if (maxScore > 5 * totalQuestions) {
      return res.status(400).json({ message: `Max score should not exceed ${5 * totalQuestions}` });
    }

    // Validate totalQuestions
    if (totalQuestions > 50) {
      return res.status(400).json({ message: 'Please make sure the total questions are 50 or less.' });
    }

    // Validate difficulty
    difficulty = difficulty.toLowerCase();
    if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
      return res.status(400).json({ message: 'Difficulty level must be either Easy, Medium, or Hard' });
    }

    // Generate questions based on input
    const questions = await generateQuiz(grade, subject, totalQuestions, maxScore, difficulty);

    const quiz = new Quiz({
      userId: req.user.userId,
      grade,
      subject: subject.toLowerCase(),
      maxScore,
      difficulty,
      questions,
      userAnswers: [],
      score: 0,
      completedDate: null,
    });

    await quiz.save();
    res.json(quiz);

  } catch (error) {
    res.status(500).json({ message: 'Error generating quiz, Please Try Again' });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, responses } = req.body;

    // Validate quizId and responses
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: 'Responses must be a non-empty array' });
    }

    // Fetch the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Evaluate the quiz
    const { score, correctAnswers } = await evaluateQuiz(quiz.questions, responses);

    // Update quiz with user responses and score
    quiz.userAnswers = correctAnswers;
    quiz.score = score;
    quiz.completedDate = new Date();
    await quiz.save();

    // Generate suggestions based on incorrect answers
    let suggestions;
    if(score === quiz.maxScore) suggestions = "There are no suggestions available.";
    else  suggestions = await generateSuggestions(quiz.questions, correctAnswers);

    // Fetch user details to send email
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await sendResultEmail(user.email, 'Quiz Results', { score }, suggestions);

    res.json({ score, correctAnswers });

  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
};

export const getQuizHistory = async (req, res) => {
  try {
    const { grade, subject, minScore, maxScore, from, to } = req.body;

    const query = {};

    // Validate grade
    if (grade && (grade < 1 || grade > 12)) {
      return res.status(400).json({ message: 'Invalid Grade' });
    }

    // Validate minScore and maxScore
    if (minScore && minScore < 0) {
      return res.status(400).json({ message: 'Min score must be greater than or equal to 0' });
    }
    if (maxScore && maxScore > 100) {
      return res.status(400).json({ message: 'Max score must be less than or equal to 100' });
    }
    if (minScore && maxScore && minScore > maxScore) {
      return res.status(400).json({ message: 'Min score cannot be greater than max score' });
    }

    // Validate date range
    if (from && to && new Date(from) > new Date(to)) {
      return res.status(400).json({ message: 'From date cannot be greater than To date' });
    }

    // Get userId from token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }
    let [scheme, token] = authHeader.split(' '); // Bearer e...

    if(token === undefined) token = scheme; // For Postman
    
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Build the query
    query.userId = userId;
    if (grade) query.grade = grade;
    if (subject) query.subject = subject.toLowerCase();
    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = minScore;
      if (maxScore) query.score.$lte = maxScore;
    }
    if (from && to) {
      query.completedDate = {
        $gte: new Date(from), // Start date
        $lte: new Date(to),   // End date
      };
    }

    const quizzes = await Quiz.find(query);

    if (quizzes.length === 0) {
      return res.json({ message: 'No quizzes found' });
    }

    // Return the quizzes
    return res.json(quizzes);
    
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Error fetching quiz history', error: error.message });
    }
  }
};

export const retryQuiz = async (req, res) => {
  try {
    const { quizId, responses } = req.body;

    // Validate quizId and responses
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: 'Responses must be a non-empty array' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Evaluate the quiz with the new responses
    const { score, correctAnswers } = await evaluateQuiz(quiz.questions, responses);

    // Create a new quiz document with the original quiz data, but a new _id and completion details
    const newQuiz = new Quiz({
      ...quiz.toObject(),
      _id: undefined,
      userAnswers: correctAnswers,
      score: score,
      completedDate: new Date(),
    });

    await newQuiz.save();

    res.json({ score, correctAnswers, newQuizId: newQuiz._id });

  } catch (error) {
    res.status(500).json({ message: 'Error retrying quiz', error: error.message });
  }
};

export const getHint = async (req, res) => {
  try {
    const { quizId, questionId } = req.body;

    // Validate inputs
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Find the question by questionId
    const question = quiz.questions.find((item) => item._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    return res.json({ hint: question.hint });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching hint', error: error.message });
  }
};
