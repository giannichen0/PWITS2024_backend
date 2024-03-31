const jwt = require("jsonwebtoken");

const jwtDecoder = (req, res) => {
    return new Promise((resolve, reject) => {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if(!authHeader) return res.status(400).json({message : "Bearer mancante"})
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
               return res.status(400).json({message : "Token non valido"})
            } else {
                resolve(decoded.user.id);
            }
        });
    });
};

module.exports = jwtDecoder;
