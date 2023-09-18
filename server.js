const dotenv = require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const app = express();


const port = process.env.PORT || 3000;


app.use(express.json());
app.use("/api/users", require("./src/routes/business/users/userRoute"));


app.listen(port, () => {
    console.log(`server is up and running on ${port}`);
})