const jwt = require("jsonwebtoken")

const verifyJWT = (req,res,next)=>{
    const authHeader = req.headers.authorization || req.headers.Authorization

    if(!authHeader?.startsWith("Bearer ")) return res.status(401).json({message : "Unauthorized, Bearer mancante"})
    
    const token = authHeader.split(" ")[1]
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden', err })
            req.name = decoded.user.name
            req.email = decoded.user.email
            req.role = decoded.user.role
            req.id = decoded.user._id
            next()
        }
    )
}

module.exports = verifyJWT