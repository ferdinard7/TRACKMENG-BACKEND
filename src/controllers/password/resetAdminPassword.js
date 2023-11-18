const db = require("../../config/dbConfig");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const sendResetEmail = require("./resetPassword");


// Create a promise-based version of db.query
const dbQuery = promisify(db.query).bind(db);


// FORGOT PASSWORD
const AdminforgotPassword = async (req, res) => {

  const { email } = req.body;

  const query = 'SELECT * FROM admins WHERE email = ?'

  try {

    // Check if the email exists in the database
    const user = await dbQuery(query, [email]);

    if (user.length === 0) {
      return res.status(404).json('User not found');
    }

    const foundUser = user[0];

    // Generate a JWT token for password reset
    const token = jwt.sign({
      user: {
        id: foundUser.idusers,
        email: foundUser.email
      },
    }, process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' });

    console.log(token);
    console.log(foundUser.email);

    // Send a reset password link to the user's email
    const resetLink = `http://yourapp.com/reset-password?token=${token}`;

    sendResetEmail(foundUser.email, resetLink);

    res.status(200).json(token);

  } catch (err) {
    console.log(err)
  }

}

const updateAdminPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });

    const updatedAdminId = decoded.user.id; // Assuming this is the user ID from the token

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    const updateQuery = 'UPDATE admins SET password = ? WHERE idusers = ?';
    const result = await dbQuery(updateQuery, [hashedPassword, updatedAdminId]);

    res.status(200).json('Password reset successfully');
    console.log(result);
  } catch (error) {
    console.error(error);
    return res.status(401).json('Invalid or expired token');
  }
};


const changeAdminPassword = async (req, res) => {
  // Assuming the user ID is stored in req.user.id
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Validate the request
  if (!currentPassword || !newPassword) {
    return res.status(400).json('Both currentPassword and newPassword are required');
  }

  // Fetch the current hashed password from the database
  const getUserQuery = 'SELECT password FROM admins WHERE idusers = ?';

  try {
    const result = await dbQuery(getUserQuery, [userId]);

    if (result.length === 0) {
      return res.status(404).json('User not found');
    }

    const hashedPassword = result[0].password;

    // Compare the currentPassword provided by the user with the hashed password in the database
    const passwordMatch = await bcrypt.compare(currentPassword, hashedPassword);

    if (!passwordMatch) {
      return res.status(401).json('Current password is incorrect');
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    const updatePasswordQuery = 'UPDATE admins SET password = ? WHERE idusers = ?';

    const updateResult = await dbQuery(updatePasswordQuery, [hashedNewPassword, userId]);

    if (updateResult.affectedRows === 0) {
      return res.status(500).json('Error updating password');
    }

    res.status(200).json('Password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json('Internal Server Error');
  }
};


module.exports = {
  AdminforgotPassword,
  updateAdminPassword,
  changeAdminPassword,
}