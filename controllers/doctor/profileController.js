const Doctor = require("../../models/Doctor");
const Admin = require("../../models/Admin")
const Patient = require("../../models/Patient");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");
const { checkId } = require("../../helper/checker");
const jwtDecoder = require("../../helper/jwtDecoder");

//@desc GET doctor profile
//@route GET /doctor/profile
//@access Private
const getDoctorProfile = asyncHandler(async (req, res) => {
    const doctorId = await jwtDecoder(req, res);
    if (!doctorId)
        return res.status(400).json({ message: "Id mancante" });
    if (!checkId(doctorId))
        return res.status(400).json({ message: "id non valido" });

    const doctor = await Doctor.findById(doctorId).lean().exec();
    if (!doctor || doctor?._id.toString() !== doctorId)
        return res.status(400).json({ message: "Dottore non trovato" });

    res.json(doctor);
});

//@desc PUT update doctor
//@route PUT /doctor/profile
//@access Private
const updateDoctor = asyncHandler(async (req, res) => {
    //da modificare appena implemento il jwt
    const { name, surname, password, email, telefono } = req.body;
    const id = await jwtDecoder(req, res);
    if (!id) {
        return res.status(400).json({ message: "Id mancante" });
    }
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }

    const doctor = await Doctor.findById(id).exec();

    if (!doctor || doctor?._id.toString() !== id) {
        return res.status(400).json({ message: "Dottore non valido" });
    }
    if (name) doctor.name = name;
    if (surname) doctor.surname = surname;
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

        doctor.email = email;
    }
    if (telefono) doctor.telefono = telefono;

    await doctor.save();
    res.status(200).json({ message: "Dottore aggiornato" });
});

module.exports = { getDoctorProfile, updateDoctor };
