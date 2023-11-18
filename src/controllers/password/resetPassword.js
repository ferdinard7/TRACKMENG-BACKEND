const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });

const sendResetEmail = async (email, resetLink) => {
    const mailOptions = {
      from: process.env.USER,
      to: email,
      subject: 'PASSWORD RESET',
      text: `Your request for a password reset was successful, click the link below to rest your password`,
      html: `<p>Your reset link is: ${resetLink}</p>`
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`password reset sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset link:', error);
      throw new Error('Failed to send password reset.');
    }
  };


  module.exports = sendResetEmail