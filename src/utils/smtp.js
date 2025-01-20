import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: true,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });


    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };


    // console.log("Sending email to:", options.email);
    await transporter.sendMail(mailOptions);
    // console.log("Email sent successfully");
  } catch (error) {
    // console.error("Error sending email:", error.message);
    throw new Error("Error sending email: " + error.message);
  }
};

export { sendEmail };
