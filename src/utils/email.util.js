import nodemailer from 'nodemailer';
import { ApiError } from './apiError.js';

// Configure the transporter for sending emails
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends an email with the provided subject and message to the recipient's email address.
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} message - The email message content.
 */
export const sendEmail = async (email, subject, message) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: message,
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new ApiError('Failed to send email. Please try again later.', 500);
    }
};

/**
 * Sends an OTP to the specified email address.
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The one-time password to be sent.
 */
export const sendOTP = async (email, otp) => {
    const subject = 'Verify your email';
    const message = `Your OTP is: ${otp}`;
    await sendEmail(email, subject, message);
};
