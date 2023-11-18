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