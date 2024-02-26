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
        res.status(400).json({ message: "all fields required" });

    //check sul ruolo e esistenza di user
    let role;
    let foundUser = await Admin.findOne({ email }).lean().exec();
    if (foundUser) {
        role = "admin";
    } else {
        foundUser = await Doctor.findOne({ email }).lean().exec();
        if (foundUser) {
            role = "doctor";
        } else {
            foundUser = await Patient.findOne({ email }).lean().exec();
            if (foundUser) {
                role = "patient";
            } else {
                role = null;
                res.status(401).json({
                    message: "unauthorized. User not found",
                });
            }
        }
    }

    //check su password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match)
        return res.status(401).json({ message: "unauthorized. Password" });

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
        { expiresIn: "3days" }
    );

    const refreshToken = jwt.sign(
        { name: foundUser.name, email: foundUser.email, id: foundUser._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "5days" }
    );

    //setto un httpOnly cookie
    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 5 * 24 * 60 * 60 * 1000,
    });
    //rimando indietro l'access token e il cookie
    res.json({ accessToken });
});

//@desc GET refresh
//@route GET /auth/refresh
//@access Public
const refresh = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: "unauthorized" });
    const refreshToken = cookies.jwt;

    //verifica
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if (err) return res.status(403).json({ message: "forbidden" });
            let role;
            let foundUser = await Admin.findById(decoded._id).lean().exec();
            if (foundUser) {
                role = "admin";
            } else {
                foundUser = await Doctor.findById(decoded._id).lean().exec();
                if (foundUser) {
                    role = "doctor";
                } else {
                    foundUser = await Patient.findById(decoded._id)
                        .lean()
                        .exec();
                    if (foundUser) {
                        role = "patient";
                    } else {
                        role = null;
                        res.status(401).json({ message: "unauthorized" });
                    }
                }
            }
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
                { expiresIn: "3days" }
            );

            res.json({accessToken})
        })
    );
};

//@desc POST logout
//@route POST /auth/logout
//@access Public
const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
}
module.exports = { login, refresh, logout };

