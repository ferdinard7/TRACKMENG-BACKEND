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