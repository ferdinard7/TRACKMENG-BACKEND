const db = require("../../../config/dbConfig");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
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


  const updateAgentPassword = async (req, res) => {
    // Assuming the user ID is stored in req.user.id
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
  
    // Validate the request
    if (!currentPassword || !newPassword) {
      return res.status(400).json('Both currentPassword and newPassword are required');
    }
  
    // Fetch the current hashed password from the database
    const getUserQuery = 'SELECT password FROM agents WHERE idagents = ?';
  
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
      const updatePasswordQuery = 'UPDATE agents SET password = ? WHERE idagents = ?';
  
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
    loginAgentEmail,
    loginAgentNumber,
    getAgentInfo,
    updateAgentInfo,
    updateAgentPassword,
  }