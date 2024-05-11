require("dotenv").config();
const Admin = require("../../models/Admin");
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
 
//@desc POST login
//@route POST /auth
//@access Public
const login = asyncHandler(async (req, res) => {
    //check se sono validi
    const { email, password } = req.body;
    if (!email || !password)
        res.status(400).json({ message: "Tutti i campi sono richiesti" });

    //check sul ruolo e esistenza di user
    let role;
    let foundUser = await Admin.findOne({ email }).exec();
    if (foundUser) {
        role = "admin";
    } else {
        foundUser = await Doctor.findOne({ email }).exec();
        if (foundUser) {
            role = "doctor";
        } else {
            foundUser = await Patient.findOne({ email }).exec();
            if (foundUser) {
                role = "patient";
            } else {
                role = null;
                res.status(401).json({
                    message: "Unauthorized",
                });
            }
        }
    }

    //check su password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match)
        return res.status(401).json({ message: "Unauthorized" });

    //creazione di access token
    const accessToken = jwt.sign(
        {
            user: {
                name: foundUser.name,
                email: foundUser.email,
                id: foundUser._id,
                role: role,
            },
        },

        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10m" }
    );

    const refreshToken = jwt.sign(
        {user:{ name: foundUser.name, email: foundUser.email, id: foundUser._id, role: foundUser.role }},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1days" }
    );

    //setto un httpOnly cookie
    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: "none",
        maxAge: 1 * 24 * 60 * 60 * 1000,
    });
    res.cookie("role", role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: "none",
        maxAge: 1 * 24 * 60 * 60 * 1000,
    });
    //rimando indietro l'access token e il cookie
    res.json({accessToken : accessToken, role : role });
});

//@desc GET refresh
//@route GET /auth/refresh
//@access Public
const refresh = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
    const refreshToken = cookies.jwt;
    const role = cookies.role

    //verifica
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            
            if (err) return res.status(403).json({ message: "Forbidden" });
            
            const accessToken = jwt.sign(
                {
                    user: {
                        name: decoded.user.name,
                        email: decoded.user.email,
                        id: decoded.user.id,
                        role:role
                    },
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "10m" }
            );

            res.json({ accessToken : accessToken, role : role});
        })
    );
};

//@desc POST logout
//@route POST /auth/logout
//@access Public
const logout = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt)
        return res.status(200).json({ message: "Impossibile fare il logout" }); //No content
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None"
    //,secure: true 
});
    res.json({ message: "Ciao Ciao" });
};

module.exports = { login, refresh, logout };
