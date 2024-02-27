const jwt = require("jsonwebtoken");

const jwtDecoder = (req, res) => {
    return new Promise((resolve, reject) => {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if(!authHeader) return res.status(400).json({message : "No Bearer provided"})
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
               return res.status(400).json({message : "invalid token"})
            } else {
                console.log("Decoded user:", decoded.user);
                resolve(decoded.user.id);
            }
        });
    });
};

module.exports = jwtDecoder;
