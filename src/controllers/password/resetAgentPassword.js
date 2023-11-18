const db = require("../../config/dbConfig");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const  sendResetEmail  = require("./resetPassword");


// Create a promise-based version of db.query
const dbQuery = promisify(db.query).bind(db);


// FORGOT PASSWORD
const AgentforgotPassword =  async (req, res) => {

  const { email } = req.body;

  const query = 'SELECT * FROM agents WHERE email = ?'

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
        id: foundUser.idagents,
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


const updateAgentPassword = async (req, res, next) => {
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
    const updateQuery = 'UPDATE agents SET password = ? WHERE idagents = ?';
    const result = await dbQuery(updateQuery, [hashedPassword, updatedAdminId]);

    res.status(200).json('Password reset successfully');
    console.log(result);
  } catch (error) {
    console.error(error);
    return res.status(401).json('Invalid or expired token');
  }
};






module.exports = {
  AgentforgotPassword,
  updateAgentPassword,
}