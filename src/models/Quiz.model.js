import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: Number,
    required: true,
    min: 1
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  questions: [
    {
      question: {
        type: String,
        required: true
      },
      options: {
        type: [String],
        required: true
      },
      correctAnswer: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D'] // assuming options are A, B, C, D
      },
      hint: String,
      marks: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],
  userAnswers: [
    {
      questionId: {
        type: String,
        required: true
      },
      userAnswer: {
        type: String,
        required: true
      },
      correctAnswer: {
        type: String,
        required: true
      }
    }
  ],
  score: {
    type: Number,
    default: 0
  },
  completedDate: {
    type: Date,
    default: Date.now
  }
});

const Quiz = mongoose.model('Quiz', QuizSchema);
export default Quiz;
