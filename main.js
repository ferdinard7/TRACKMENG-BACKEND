const dotenv = require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const app = express();


const port = process.env.PORT || 3000;


app.use(express.json());
app.use("/api/users", require("./src/routes/business/users/adminRoute"));
app.use("/api", require("./src/routes/business/users/agentRoute"));


app.listen(port, () => {
    console.log(`server is up and running on ${port}`);
})


const express = require("express");
const validateToken = require("../../../middleware/validateTokenHandler");
const { getCurrentUser } = require("../../../controllers/business/users/auth");
const { getAllAgents } = require("../../../controllers/business/users/adminController");
const { loginAgentEmail, loginAgentNumber, getAgentInfo, updateAgentInfo } = require("../../../controllers/business/users/agentController");
const router = express.Router();

// GET ALL AGENTS
router.get("/agents", getAllAgents);

// LOGIN AGENT WITH EMAIL
router.post("/login-agent-email", loginAgentEmail);

// LOGIN AGENT WITH PHONE NUMBER
router.post("/login-agent-number", loginAgentNumber);

// GET CURRENT LOGGED-IN USER
router.get("/current", validateToken, getCurrentUser);

// GET ADMIN INFO
router.get("/agent-info", validateToken, getAgentInfo);

// UPDATE AGENT INFO
router.put("/update-agent", validateToken, updateAgentInfo);

// router.post("/register-agent", validateToken, registerAgent);


module.exports = router;


const express = require("express");
const validateToken = require("../../../middleware/validateTokenHandler");
const { registerAdmin, getCurrentUser, registerAgent, loginAdminEmail, loginAdminNumber, getAdminInfo, updateAdminInfo } = require("../../../controllers/business/users/auth");
const { getAllAdmins } = require("../../../controllers/business/users/adminController");
const { sendOTPPhoneNumber, sendOTPverificationEmail } = require("../../../controllers/business/users/otpController");
const router = express.Router();

// GET ALL ADMINS
router.get("/admins", getAllAdmins);

// REGISTER ADMIN
router.post("/register-admin", registerAdmin);

// SEND OTP TO USER NUMBER
router.get("/send-otp/:phoneNumber", sendOTPPhoneNumber);

// SEND OTP TO USER EMAIL
router.get("/send-otp-email/:email", sendOTPverificationEmail);

// LOGIN ADMIN WITH EMAIL
router.post("/login-admin-email", loginAdminEmail);

// LOGIN ADMIN WITH PHONE NUMBER
router.post("/login-admin-number", loginAdminNumber);

// GET CURRENT LOGGED-IN USER
router.get("/current", validateToken, getCurrentUser);

// GET ADMIN INFO
router.get("/admin-info", validateToken, getAdminInfo);

// UPDATE ADMIN INFO
router.put("/update-admin", validateToken, updateAdminInfo);


router.post("/register-agent", validateToken, registerAgent);



module.exports = router; 
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const validateToken = asyncHandler(async (req, res, next) => {
    try {
        let token;
        let authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];

            if (!token) {
                res.status(401);
                throw new Error("User is not authorized or token is missing");
            }

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    res.status(401);
                    throw new Error("User is not authorized");
                }
                req.user = decoded.user;
                next();
            });
        } else {
            res.status(401);
            throw new Error("User is not authorized or token is missing");
        }
    } catch (error) {
        next(error); // Pass the error to the error-handling middleware
    }
});

module.exports = validateToken;


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

// REGISTER ADMIN WITH EMAIL
const registerAdmin = async (req, res) => {
  const { email, password, fName, mName, lName, secFirm, pNum, offAdd, identity, state } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!email || !password) {
    return res.status(400).json("All fields are mandatory!");
  }

  const checkExistingEmail = "SELECT * FROM admins WHERE email = ?";
  try {
    const data = await dbQuery(checkExistingEmail, [email]);

    if (data.length > 0) {
      return res.status(409).json("Admin already exists!");
    }

    const registrationQuery = "INSERT INTO admins (email, password, fName, mName, lName, secFirm, pNum, offAdd, identity, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const result = await dbQuery(registrationQuery, [email, hashedPassword, fName, mName, lName, secFirm, pNum, offAdd, identity, state]);

    // await sendOTPverificationEmail(result.insertId, email);
    // await sendOTPverificationNumber(result.insertId, pNum);

    return res.status(200).json("Admin registered successfully,please send the otp code sent to you in the next page!");
  } catch (error) {
    console.log("Error:" + error);
    return res.status(500).json("Error registering admin!");
  }
};


// FUNCTION TO LOGIN ADMIN
const loginAdminEmail = async (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM admins WHERE email = ?';

  try {

    const userResults = await dbQuery(query, [email]);

    if (userResults.length === 0) {
      return res.status(401).json("Wrong Credentials!"); // No admin found
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

const loginAdminNumber = async (req, res) => {

  const { pNum, password } = req.body;

  const query = 'SELECT * FROM admins WHERE pNum = ?';

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

// TO GET CURRENT USER/ADMIN 
// ACCESS IS PRIVATE
// /api/users/current

const getCurrentUser = async(req, res) => {
   res.json(req.user);

   console.log(req.user.isAdmin);
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
    const result = await dbQuery(registrationQuery, [fName, mName, lName, email, pNum, secNum, hashedPassword, registeredByUserId]);

    // await sendOTPverificationEmail(result.insertId, email);
    // await sendOTPverificationNumber(result.insertId, pNum);

    return res.status(200).json("Agent registered successfully,please send the otp code sent to you in the next page!");
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json("Error registering agent!");
  }
}

const getAdminInfo = async(req, res) => {
  const adminId = req.user.id;

  console.log(req.user);
  
  const query = 'SELECT * FROM admins WHERE idusers = ?';

  try {
    const adminResults = await dbQuery(query, [adminId]);

    if (adminResults.length === 0) {
      return res.status(404).json('Admin not found');
    }

    const adminInfo = adminResults[0];

    //  Removing sensitive information like passwords before sending the response
    const { password, ...adminData } = adminInfo;

    res.status(200).json(adminData);
  } catch (error) {
    console.error('Error fetching admin info:', error);
    res.status(500).json('Internal Server Error');
  }
}


const updateAdminInfo = async (req, res) => {
  console.log(req.user.id);

  const adminId = req.user.id;

  const { fName, mName, lName, secFirm, pNum, offAdd, identity, state, email } = req.body;

  const updateQuery =
    'UPDATE admins SET fName = ?, mName = ?, email = ?, lName = ?, secFirm = ?, pNum = ?, offAdd = ?, identity = ?, state = ? WHERE idusers = ?';

  try {

    // Execute the update query
    const result = await dbQuery(updateQuery, [
      fName,
      mName,
      email,
      lName,
      secFirm,
      pNum,
      offAdd,
      identity,
      state,
      adminId,
    ]);

    if (result.affectedRows === 0) {

      return res.status(404).json('Admin not found or no changes were made');
    }


    res.status(200).json('Admin information updated successfully');
  } catch (error) {
    console.error('Error updating admin info:', error);
    res.status(500).json('Internal Server Error');
  }
};




module.exports = {
  registerAdmin,
  loginAdminEmail,
  loginAdminNumber,
  getCurrentUser,
  registerAgent,
  getAdminInfo,
  updateAdminInfo,
};


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


const loginAgentNumber = async (req, res) => {

    const { pNum, password } = req.body;
  
    const query = 'SELECT * FROM agents WHERE pNum = ?';
  
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


  // FUNCTION TO LOGIN ADMIN
const loginAgentEmail = async (req, res) => {
    const { email, password } = req.body;
  
    const query = 'SELECT * FROM agents WHERE email = ?';
  
    try {
  
      const userResults = await dbQuery(query, [email]);
  
      if (userResults.length === 0) {
        return res.status(401).json("Wrong Credentials or Your Admin hasn't registered you, please contact your Admin!"); // No admin found
      }
  
      
      const user = userResults[0]; // Assuming you expect only one result
  
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if(!isPasswordValid) {
        res.json({message: "Password is not correct!"});
      } else if(isPasswordValid) {
        const accessToken = jwt.sign({
            user: {
              password: user.password,
              email: user.email,
              id: user.idagents,
              registered_by_admin_id: user.registered_by_admin_user_id,
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


const getAgentInfo = async(req, res) => {
    const agentId = req.user.id;

    
    const query = 'SELECT * FROM agents WHERE idagents = ?';
  
    try {
      const agentResults = await dbQuery(query, [agentId]);
  
      if (agentResults.length === 0) {
        return res.status(404).json('Agent not found');
      }
  
      const agentInfo = agentResults[0];
  
      //  Removing sensitive information like passwords before sending the response
      const { password, ...agentData } = agentInfo;
  
      res.status(200).json(agentData);
    } catch (error) {
      console.error('Error fetching agent info:', error);
      res.status(500).json('Internal Server Error');
    }
  }


  const updateAgentInfo = async (req, res) => {
    console.log(req.user.id);
  
    const agentId = req.user.id;
  
    const { fName, mName, lName, secNum, pNum, email } = req.body;
  
    const updateQuery =
      'UPDATE agents SET fName = ?, mName = ?, lName = ?, secNum = ?, pNum = ?, email = ? WHERE idagents = ?';
  
    try {
  
      // Execute the update query
      const result = await dbQuery(updateQuery, [
        fName,
        mName,
        lName,
        secNum,
        pNum,
        email,
        agentId,
      ]);
  
      if (result.affectedRows === 0) {
  
        return res.status(404).json('Agent not found or no changes were made');
      }
  
  
      res.status(200).json('Agent information updated successfully');
    } catch (error) {
      console.error('Error updating agent info:', error);
      res.status(500).json('Internal Server Error');
    }
  };


 module.exports = {
    loginAgentEmail,
    loginAgentNumber,
    getAgentInfo,
    updateAgentInfo,
  }


  const db = require("../../../config/dbConfig");


const getAllAdmins = (req, res) => {
    
    const q = "SELECT * FROM admins";
    db.query(q, (err, data) => {
        if(err) {
            res.status(500).json(err)
        } else {
            res.status(200).json(data)
        }
    })
} 


const getAllAgents = (req, res) => {
    
    const q = "SELECT * FROM agents";
    db.query(q, (err, data) => {
        if(err) {
            res.status(500).json(err)
        } else {
            res.status(200).json(data)
        }
    })
} 




module.exports = {
    getAllAdmins,
    getAllAgents,
}


const mysql = require("mysql2");


const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'ferdinar7',
    database : 'trackme'
  });
   
//   connection.connect();

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return; 
    }
    console.log('Connected to MySQL server!');
    // You can perform database operations here
  });


  module.exports = connection;