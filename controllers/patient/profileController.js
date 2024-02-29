const Patient = require("../../models/Patient");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");
const { checkId } = require("../../helper/checker");
const jwtDecoder = require("../../helper/jwtDecoder");

//@desc GET patient profile
//@route GET /patien/profile
//@access Private
const getPatientProfile = asyncHandler(async (req, res) => {
    const patientId = await jwtDecoder(req, res);
    if (!patientId)
        return res.status(400).json({ message: "missing patient id" });
    if (!checkId(patientId))
        return res.status(400).json({ message: "id is not valid" });

    const patient = await Patient.findById(patientId).lean().exec();
    if (!patient || patient?._id.toString() !== patientId)
        return res.status(400).json({ message: "patient not found" });

    res.json(patient);
});

//@desc PUT update patient profile
//@route PUT /patient/profile
//@access Private
const updatePatient = asyncHandler(async (req, res) => {
    //da modificare appena implemento il jwt
    const { name, surname, password, email, telefono } = req.body;
    const id = await jwtDecoder(req, res);
    if (!id) {
        return res.status(400).json({ message: "missing id" });
    }
    if (!checkId(id)) {
        return res.status(400).json({ message: "ID is not valid" });
    }

    const patient = await Patient.findById(id).exec();

    if (!patient || patient?._id.toString() !== id) {
        return res.status(400).json({ message: "patient not found" });
    }
    if (name) patient.name = name;
    if (surname) patient.surname = surname;
    if (password) {
        const hashedPwd = await bcrypt.hash(password, 10);
        doctor.password = hashedPwd;
    }
    if (email) {
        const duplicate = await Patient.findOne({ email }).lean().exec();
        if (duplicate) {
            return res.status(409).json({ message: "duplicate email" });
        }
        patient.email = email;
    }
    if (telefono) patient.telefono = telefono;

    await patient.save();
    res.status(200).json({ message: "patient updated" });
});

module.exports = { getPatientProfile, updatePatient };
