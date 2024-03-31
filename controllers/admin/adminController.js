const Doctor = require("../../models/Doctor");
const Admin = require("../../models/Admin")
const Patient = require("../../models/Patient");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");

const getAdmins = asyncHandler(async (req, res) => {
    const admins = await Admin.find().lean().exec();
    if (!admins?.length) return res.status(200).json({ message: "No Admin" });

    res.json(admins);
});

const createNewAdmin = asyncHandler(async (req, res) => {
    const { name, surname, password, email, telefono } = req.body;
    if (!name || !surname || !password || !email || !telefono) {
        return res
            .status(400)
            .json({ message: "Tutti i campi sono richiesti" });
    }
    const adminDuplicate = await Admin.findOne({ email }).lean().exec();
    const patientDuplicate = await Patient.findOne({ email }).lean().exec();
    const doctorDuplicate = await Doctor.findOne({ email }).lean().exec();

    if (adminDuplicate || patientDuplicate || doctorDuplicate) {
        return res.status(409).json({ message: "Email già registrata" });
    }

    

    const hashedPwd = await bcrypt.hash(password, 10);
    const adminObj = { name, surname, password: hashedPwd, email, telefono };

    const admin = await Admin.create(adminObj);
    if (admin) {
        res.status(201).json({ message: `Nuovo admin ${name} creato` });
    } else {
        res.status(400).json({ message: "Dati Admin non validi " });
    }
});
module.exports = { createNewAdmin, getAdmins };
