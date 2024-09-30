# AI Quizzer API

This is a microservice for an AI Quizzer app that manages student quizzes and scores.

## Video Tutorial Link

https://drive.google.com/file/d/1xbs0pR0_IDok72ifrtRxSL-zrX_6kMlg/view?usp=sharing

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
    MONGO_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    PORT=3000
    EMAIL_USER=your_smtp_email
    EMAIL_PASS=your_smtp_password
    GROQ_API_KEY=your_groq_api_key
   ```

3. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Documentation

Access the Swagger API documentation at `http://localhost:3000/api-docs` when the server is running.

### Authentication

- POST /api/auth/login
  - Request body: { "username": "string", "password": "string" }
  - Response: { "token": "string" }

### Quiz Management

All quiz endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token
```

- POST /api/quiz/generate
  - Request body: { "grade": number, "subject": "string", "maxScore": number, "totalQuestion": number, "difficulty": "string" }
  - Response: Generated quiz object

- POST /api/quiz/submit
  - Request body: { "quizId": "string", "responses": [{}] }
  - Response: { "score": number, "correctAnswers": [boolean], "suggestions": [string] }

- POST /api/quiz/history
  - Query parameters: grade, subject, minScore, maxScore, from, to
  - Response: Array of quiz objects

- POST /api/quiz/retry
  - Request body: { "quizId": "string", "responses": [{}] }
  - Response: { "score": number, "correctAnswers": [boolean], "newQuizId": "string" }

- POST /api/quiz/hint
  - Request body: { "quizId": "string", "questionId": "string" }
  - Response: { "hint": "string" }

## Docker Deployment

1. Build the Docker image:
   ```
   docker build -t username/ai-quizzer .
   ```

2. Run the container:
   ```
   docker run -d -p 3000:3000 username/ai-quizzer:tag
   ```
