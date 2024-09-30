import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendResultEmail = async (to, subject, quizResult, suggestions) => {
  try {
    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: `
        <h1>Quiz Results</h1>
        <p><strong>Score:</strong> ${quizResult.score}</p>
        <h2>Suggestions to Improve:</h2>
        <p>${suggestions}</p>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
