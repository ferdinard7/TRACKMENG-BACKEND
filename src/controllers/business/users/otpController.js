const db = require("../../../config/dbConfig");
const nodemailer = require("nodemailer");
const { promisify } = require("util");
const accountSid = "AC885b7c529496ab7a8bc0888d7bde78e2"
const authToken = "e58f4d435fe37978b6d767409a555d2f"
const twilio = require('twilio')(accountSid, authToken);
const otpGenerator = require("otp-generator");
const asyncHandler = require("express-async-handler");

// Create a promise-based version of db.query
const dbQuery = promisify(db.query).bind(db);

// Send OTP to the user's email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });
  
  // Testing success
  transporter.verify((err, success) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Ready for message to be sent");
      console.log(success);
    }
  });

  // FUNCTION TO SEND OTP TO REGISTERED ADMIN PHONE NUMBER
const sendOTPPhoneNumber = asyncHandler(async (req, res) => {
    // const { email } = req.body;
    try {
      const phoneNumber = req.params.phoneNumber;
      const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
      console.log(otp);
  
      const message = await twilio.messages.create({
        body: `Your OTP is: ${otp}, please Do not disclose this code`,
        from: process.env.TWILIOTESTNUMBER,
        to: phoneNumber,
      });
  
      const insertOtpQuery = "INSERT INTO otp_codes (phone_number, otp) VALUES (?, ?)";
      await dbQuery(insertOtpQuery, [phoneNumber, otp]);
  
      res.json({ message: `OTP sent successfully to ${phoneNumber} and otp saved in the database succesfully` });
    } catch (error) {
      console.error('Error sending OTP via Twilio:', error);
      res.status(500).json({ error: 'Failed to send OTP.' });
    }
  })
  
  // FUNCTION TO GET THE NODEMAILER READY AND SEND OTP TO ADMIN
  const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
      from: process.env.USER,
      to: email,
      subject: 'Verify OTP for Registration',
      text: `Your OTP code is: ${otp}, please do not disclose this and you be mumu boy sha!`,
      html: `<p>Your OTP code is: ${otp}</p>`
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email.');
    }
  };
  
  // FUNCTION TO CARRY OUT THE SENDOTP TO ADMIN IF THEY OPT FOR EMAIL OPTION INSTEAD
  const sendOTPverificationEmail = async (req, res) => {
      
    try {
      const email = req.params.email;
      const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
      console.log(otp)
  
      await sendOTPEmail(email, otp);
  
      // Store the OTP in the database
      const insertOtpQuery = "INSERT INTO otp_codes (userEmail, otp) VALUES (?, ?)";
      await dbQuery(insertOtpQuery, [email, otp]);
  
      res.json({ message: `OTP sent successfully to ${email}` });
    } catch (error) {
      console.error('Route Error:', error);
      res.status(500).json({ error: 'Failed to send OTP email.' });
    }
  
  };


  module.exports = {
    sendOTPPhoneNumber,
    sendOTPverificationEmail,
  }