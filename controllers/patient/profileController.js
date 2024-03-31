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
        return res.status(400).json({ message: "Id mancante" });
    if (!checkId(patientId))
        return res.status(400).json({ message: "Id non valido" });

    const patient = await Patient.findById(patientId).lean().exec();
    if (!patient || patient?._id.toString() !== patientId)
        return res.status(400).json({ message: "Paziente non trovato" });

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
        return res.status(400).json({ message: "Id mancante" });
    }
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }

    const patient = await Patient.findById(id).exec();

    if (!patient || patient?._id.toString() !== id) {
        return res.status(400).json({ message: "Paziente non trovato" });
    }
    if (name) patient.name = name;
    if (surname) patient.surname = surname;
    if (password) {
        const hashedPwd = await bcrypt.hash(password, 10);
        doctor.password = hashedPwd;
    }
    if (email) {
        const adminDuplicate = await Admin.findOne({ email }).lean().exec();
        const patientDuplicate = await Patient.findOne({ email }).lean().exec();
        const doctorDuplicate = await Doctor.findOne({ email }).lean().exec();

        if (adminDuplicate || patientDuplicate || doctorDuplicate) {
            return res.status(409).json({ message: "Email già registrato" });
        }

        patient.email = email;
    }
    if (telefono) patient.telefono = telefono;

    await patient.save();
    res.status(200).json({ message: "Paziente aggiornato" });
});

module.exports = { getPatientProfile, updatePatient };
