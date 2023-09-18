// WRAPPING THE SQL DATABASE IN A PROMISE, SO THE ASYNC CAN WORK AND IT DEOSNT SHWOING PROGRAMMING ERROR
// AND THEN IT CAN SAVE THE HASHED OTP IN THE VERIFYOTP TABLE

const db = require("../../../config/dbConfig");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const nodemailer = require("nodemailer");
const { promisify } = require("util");
const accountSid = "AC885b7c529496ab7a8bc0888d7bde78e2"
const authToken = "e58f4d435fe37978b6d767409a555d2f"
const twilio = require('twilio')(accountSid, authToken);
const otpGenerator = require("otp-generator");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

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

// OTP expiration time in minutes
const otpExpirationTime = 50;

// REGISTER USER WITH EMAIL
const registerUser = async (req, res) => {
  const { email, password, fName, mName, lName, secFirm, pNum, offAdd, identity, state } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!email || !password) {
    return res.status(400).json("All fields are mandatory!");
  }

  const checkExistingEmail = "SELECT * FROM users WHERE email = ?";
  try {
    const data = await dbQuery(checkExistingEmail, [email]);

    if (data.length > 0) {
      return res.status(409).json("User already exists!");
    }

    const registrationQuery = "INSERT INTO users (email, password, fName, mName, lName, secFirm, pNum, offAdd, identity, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const result = await dbQuery(registrationQuery, [email, hashedPassword, fName, mName, lName, secFirm, pNum, offAdd, identity, state]);

    // await sendOTPverificationEmail(result.insertId, email);
    // await sendOTPverificationNumber(result.insertId, pNum);

    return res.status(200).json("User registered successfully,please send the otp code sent to you in the next page!");
  } catch (error) {
    console.log("Error:" + error);
    return res.status(500).json("Error registering user!");
  }
};

// FUNCTION TO SEND OTP TO REGISTERED USER PHONE NUMBER
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

// FUNCTION TO GET THE NODEMAILER READY AND SEND OTP TO USER
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.USER,
    to: email,
    subject: 'Verify OTP for Registration',
    text: `Your OTP code is: ${otp}, please do not disclose this nad you be mumu boy sha!`,
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

// FUNCTION TO CARRY OUT THE SENDOTP TO USER IF THEY OPT FOR EMAIL OPTION INSTEAD
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


  //   await transporter.sendMail(mailOptions);
  //   console.log('Verification Email sent to: ', email);
  // } catch (err) {
  //   console.error('Error sending email: ', err);
  // }
};


// FUNCTION TO LOGIN USER
const loginUserEmail = async (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';

  try {

    const userResults = await dbQuery(query, [email]);

    if (userResults.length === 0) {
      return res.status(401).json("Wrong Credentials!"); // No user found
    }

    
    const user = userResults[0]; // Assuming you expect only one result

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if(isPasswordValid) {
      const accessToken = jwt.sign({
          user: {
            password: user.password,
            email: user.email,
            id: user.idusers,
            isAdmin: user.isAdmin,
          },
      }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30m"
      })

      // password: _,
      const { password, ...userData } =  user;
        res.status(200).json({...userData, accessToken})

    } else {
        res.status(401).json({message: "Email or password is not valid!"});
        throw new Error ("Email or password is not valid");
    }

  } catch(error) {
    console.error('Error logging in:', error);
    res.status(500).json("Email or password is not valid");
  }

}

// TO LOGIN USER WITH PHONE NUMBER AND PASSWORD

const loginUserNumber = async (req, res) => {

  const { pNum, password } = req.body;

  const query = 'SELECT * FROM users WHERE pNum = ?';

  try {

    const userResults = await dbQuery(query, [pNum]);

    if (userResults.length === 0) {

      return res.status(401).json("Wrong Credentials!"); // No user found
    }

    
    const user = userResults[0]; // Assuming you expect only one result

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if(isPasswordValid) {
      const accessToken = jwt.sign({
          user: {
            password: user.password,
            email: user.email,
            id: user.idusers,
            isAdmin: user.isAdmin,
            pNum: user.pNum,
          },
      }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30m"
      })

      // password: _,
      const { password, ...userData } =  user;
        res.status(200).json({...userData, accessToken})

    } else {
        res.status(401).json({message: "Number or password is not valid"});
        throw new Error ("Number or password is not valid")
    }

  } catch(error) {
    console.error('Error logging in:', error);
    res.status(500).json("Internal Server Error");
  }

}

// TO GET CURRENT USER 
// ACCESS IS PRIVATE
// /api/users/current

const getCurrentUser = async(req, res) => {
   res.json(req.user);
}


// REGISTER AGENT AS A LOGGED IN ADMIN
const registerAgent = async( req, res)  => {

  console.log(req.user.id);
  const { fName, mName, lName, email, pNum, secNum, password, cPassword } = req.body;

  // CHECKING IF THE PASSWORD AND CONFIRM PASSWORD ARE THE SAME BEFORE PROCEEDING WITH REGISTRATION
  if (password !== cPassword) {
    return res.status(400).json("Passwords do not match.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!email || !password) {
    return res.status(400).json("All fields are mandatory!");
  }

   // Get user ID from decoded JWT payload
   const registeredByUserId = req.user.id;

  const checkExistingEmail = "SELECT * FROM agents WHERE email = ?";
  try {
    const data = await dbQuery(checkExistingEmail, [email]);

    if (data.length > 0) {
      return res.status(409).json("Agent already exists!");
    }

    const registrationQuery = "INSERT INTO agents (fName, mName, lName, email, pNum, secNum, password, registered_by_admin_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const result = await dbQuery(registrationQuery, [fName, mName, lName, email, pNum, secNum, password, registeredByUserId]);

    // await sendOTPverificationEmail(result.insertId, email);
    // await sendOTPverificationNumber(result.insertId, pNum);

    return res.status(200).json("Agent registered successfully,please send the otp code sent to you in the next page!");
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json("Error registering agent!");
  }
}


// const verifyEmailOtp = async (req, res) => {
//   try {
//     let { id, otp } = req.body;
//     if (!id || !otp) {
//       return res.status(400).json("Empty OTP details are not allowed!");
//     } else {
//       const userOtpVerification = "SELECT * FROM verifyotp WHERE userId = ?";
//       const userOTPverification = await dbQuery(userOtpVerification, [id]);

//       if (userOTPverification.length <= 0) {
//         return res.status(400).json("Account record doesn't exist or has already been verified!");
//       } else {

//         const { expirationTime, OTP: hashedOTP } = userOTPverification[0];


//         const currentTime = new Date(); // Get the current time

//         if (expirationTime.getTime() > currentTime.getTime()) { // Compare as Date objects
//           const deleteQuery = "DELETE FROM verifyotp WHERE userId = ?";
//           await dbQuery(deleteQuery, [id]);
//           return res.status(400).json("Code has expired. Request OTP again!");
//         } else {
//           const validOTP = await bcrypt.compare(otp, hashedOTP);

//           if (!validOTP) {
//             return res.status(400).json("Invalid code provided. Please check your inbox!");
//           } else {

//             return res.status(200).json("User email has been verified successfully!");
//           }
//         }
//       }
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Internal Server Error");
//   }
// };


// // SENDING OTP TO USER EMAIL 

// const sendOTPverificationNumber = async (id, pNum) => {
//   try {
//     const otp = randomstring.generate({
//       length: 6,
//       charset: 'numeric'
//     });

//     const expirationTime = new Date();
//     expirationTime.setMinutes(expirationTime.getMinutes() + otpExpirationTime);

//     // const mailOptions = {
//     //   from: process.env.USER,
//     //   to: email,
//     //   subject: 'Verify OTP for Registration',
//     //   text: `Your OTP for registration is: ${otp} and it expires in ${otpExpirationTime} minutes
//     //   .Please Do not disclose or share this code to anyone`
//     // };

//     twilio.messages.create({
//       body: `Your OTP for registration is: ${otp}`,
//       from: process.env.TWILIOTESTNUMBER,
//       to: pNum
//     })
//     .then(message => {
//       console.log(`OTP sent successfully to ${pNum}`);
//       // Handle success response
//     })
//     .catch(error => {
//       console.error('Error sending OTP:', error);
//       // Handle error response
//     });

//     const hashedOTP = await bcrypt.hash(otp, 10);
//     const userOTPverification = "INSERT INTO verifyotp (userId, OTP) VALUES (?, ?)";
//     await dbQuery(userOTPverification, [id, hashedOTP]);

//     // await transporter.sendMail(mailOptions);
//     // console.log('Verification Email sent to: ', pNum);
//   } catch (err) {
//     console.error('Error sending OTP: ', err);
//   }
// };




// const verifyNumberOtp = async (req, res) => {
//   try {
//     let { id, otp } = req.body;
//     if (!id || !otp) {
//       return res.status(400).json("Empty OTP details are not allowed!");
//     } else {
//       const userOtpVerification = "SELECT * FROM verifyotp WHERE userId = ?";
//       const userOTPverification = await dbQuery(userOtpVerification, [id]);

//       if (userOTPverification.length <= 0) {
//         return res.status(400).json("Account record doesn't exist or has already been verified!");
//       } else {

//         const { expirationTime, OTP: hashedOTP } = userOTPverification[0];


//         const currentTime = new Date(); // Get the current time

//         if (expirationTime.getTime() > currentTime.getTime()) { // Compare as Date objects
//           const deleteQuery = "DELETE FROM verifyotp WHERE userId = ?";
//           await dbQuery(deleteQuery, [id]);
//           return res.status(400).json("Code has expired. Request OTP again!");
//         } else {
//           const validOTP = await bcrypt.compare(otp, hashedOTP);

//           if (!validOTP) {
//             return res.status(400).json("Invalid code provided. Please check your inbox!");
//           } else {

//             return res.status(200).json("Phone number has been verified successfully!");
//           }
//         }
//       }
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Internal Server Error");
//   }
// }





module.exports = {
  registerUser,
  sendOTPPhoneNumber,
  sendOTPverificationEmail,
  loginUserEmail,
  loginUserNumber,
  getCurrentUser,
  registerAgent,
  // verifyEmailOtp,
  // verifyNumberOtp,
};