const allowedOrigins = require("./allowedOrigins")

const corsOptions = {
    origin: (origin, callback)=>{
        //!origin per poter permettere a postman et simila di funzionare dato che non hanno un origin
        if (allowedOrigins.indexOf(origin) !==-1 || !origin){
            callback(null, true)
        } else{
            callback(new Error("NOT ALLOWED BY CORS"))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions