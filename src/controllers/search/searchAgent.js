const db = require("../../config/dbConfig");
const { promisify } = require("util");


// Create a promise-based version of db.query
const dbQuery = promisify(db.query).bind(db);

const searchAnyAgent = async(req, res) => {

    const { name } = req.body;

    const namee = name.toLowerCase();

    const query = `SELECT * FROM agents WHERE fName LIKE ?`

    try {
  
      // Check if the email exists in the database
      const user = await dbQuery(query, [`%${namee}%`])
  
      if (user.length === 0) {
        return res.status(404).json('User not found');
      }
  
      const foundUser = user[0];
   
    //   console.log(foundUser);

      res.status(200).json(foundUser);
  
    } catch (err) {
      console.log(err)
    }

}




module.exports = {
    searchAnyAgent,
}