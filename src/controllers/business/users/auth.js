// WRAPPING THE SQL DATABASE IN A PROMISE, SO THE ASYNC CAN WORK AND IT DEOSNT SHWOING PROGRAMMING ERROR
// AND THEN IT CAN SAVE THE HASHED OTP IN THE VERIFYOTP TABLE
const db = require("../../../config/dbConfig");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { promisify } = require("util");
const accountSid = "AC885b7c529496ab7a8bc0888d7bde78e2"
const authToken = "e58f4d435fe37978b6d767409a555d2f"
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
    if (isPasswordValid) {
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
      const { password, ...userData } = user;
      res.status(200).json({ ...userData, accessToken })

    } else {
      res.status(401).json({ message: "Email or password is not valid!" });
      throw new Error("Email or password is not valid");
    }

  } catch (error) {
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

    if (isPasswordValid) {
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
      const { password, ...userData } = user;
      res.status(200).json({ ...userData, accessToken })
    } else {
      res.status(401).json({ message: "Number or password is not valid" });
      throw new Error("Number or password is not valid")
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json("Internal Server Error");
  }
}
// TO GET CURRENT USER/ADMIN 
// ACCESS IS PRIVATE
// /api/users/current
const getCurrentUser = async (req, res) => {
  res.json(req.user);
  console.log(req.user.isAdmin);
}

// REGISTER AGENT AS A LOGGED IN ADMIN
const registerAgent = async (req, res) => {

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

    return res.status(200).json("Agent registered successfully,please send the otp code sent to you in the next page!");
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json("Error registering agent!");
  }
}

// GET ALL ADMIN INFO
const getAdminInfo = async (req, res) => {
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
    const result = await dbQuery(updateQuery, [fName,mName,email,lName,secFirm,pNum,offAdd,identity,state,adminId,]);

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