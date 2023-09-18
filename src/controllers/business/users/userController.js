const db = require("../../../config/dbConfig");
const asyncHandler = require("express-async-handler");




const getAllUsers = (req, res) => {
    
    const q = "SELECT * FROM users";
    db.query(q, (err, data) => {
        if(err) {
            res.status(500).json(err)
        } else {
            res.status(200).json(data)
        }
    })
} 

// const mysql = require("mysql2");


// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "ferdinar7",
//     database: "trackme"
// })






module.exports = {
    getAllUsers,
}