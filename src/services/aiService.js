import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Function to get chat completion from Groq API
export async function getGroqChatCompletion(message) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
    model: "llama3-8b-8192",
  });
}

function removeContentFromLastBracket(inputString) {
  const endIndex = inputString.lastIndexOf(']');
  if (endIndex !== -1) {
    return inputString.substring(0, endIndex + 1);
  }
  return inputString;
}
function removeContentFromFirstBracket(inputString) {
  const startIndex = inputString.indexOf('[');
  if (startIndex !== -1) {
    return inputString.substring(startIndex);
  }
  return inputString;
}

// Generate quiz questions using Groq API
export const generateQuiz = async (grade, subject, totalQuestions, maxScore, difficulty) => {
  const message = `Generate a set of questions for Grade ${grade} ${subject}. The total number of questions should be ${totalQuestions}, with a maximum score of ${maxScore} for all questions. The difficulty level of the questions should be ${difficulty}. Each question should include the question text, multiple-choice options, the correct answer (A, B, C, or D), a hint, and the marks for each question. Provide a variety of topics within ${subject}. Return the data only as a JSON array without a name, like: [{},{}]. Ensure the JSON format is as follows:

[
  {
    "question": "String",
    "options": ["String", "String", "String", "String"],
    "correctAnswer": "String",
    "hint": "String",
    "marks": Number
  }
]
`;

  const chatCompletion = await getGroqChatCompletion(message);
  const result = removeContentFromLastBracket(removeContentFromFirstBracket(chatCompletion.choices[0].message.content));
  const data = JSON.parse(result);

  return data;
};

// Evaluate quiz responses and calculate score
export const evaluateQuiz = async (questions, responses) => {
  let score = 0;
  const correctAnswers = [];

  questions.forEach((q) => {
    const id = q._id.toString();
    const userResponse = responses.find((ans) => ans.questionId === id);
    if (userResponse) {
      if (q.correctAnswer === userResponse.answer) {
        score += q.marks;
      }
      correctAnswers.push({
        questionId: id,
        userAnswer: userResponse.answer,
        correctAnswer: q.correctAnswer
      });
    }
  });

  return { score, correctAnswers };
};

// Generate performance suggestions based on quiz results
export const generateSuggestions = async (questions, correctAnswers) => {
  const message = `Give based on user performance suggestion for preparation Here is questions ${JSON.stringify(questions)} and user answers ${JSON.stringify(correctAnswers)}. Give in 15-20 words only.`;
  const chatCompletion = await getGroqChatCompletion(message);
  return chatCompletion.choices[0].message.content;
};
