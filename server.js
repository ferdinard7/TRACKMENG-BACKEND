const dotenv = require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const app = express();
const cors = require("cors");

const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use("/api/users", require("./src/routes/business/users/adminRoute"));
app.use("/api", require("./src/routes/business/users/agentRoute"));
app.use("/api", require("./src/routes/business/users/passwordRoute"));
app.use("/api", require("./src/routes/business/users/searchRoute"));


app.listen(port, () => {
    console.log(`server is up and running on ${port}`);
})