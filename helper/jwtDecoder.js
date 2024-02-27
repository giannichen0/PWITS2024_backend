const jwt = require("jsonwebtoken")

const jwtDecoder =  (token)=>{
     jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            console.log(decoded)
            if (err) return {status : 400}
            return {id : decoded.user.id}
        }
    )
}

module.exports = jwtDecoder